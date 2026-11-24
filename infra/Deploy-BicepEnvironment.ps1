<#
.SYNOPSIS
    Deploys the Bicep infrastructure of one environment at subscription scope.

.DESCRIPTION
    Runs `az deployment sub create` on Environment/main.entrypoint.bicep with
    Environment/main.<Environment>.bicepparam. Interactively, it shows a what-if first and
    asks for confirmation. With -PipelineMode it deploys without asking (the pipelines-nexus
    infra deploy stage calls it this way). With -DryRun it only runs the what-if.

.PARAMETER Environment
    Environment code. Environment/main.<Environment>.bicepparam must exist next to this script.

.PARAMETER DryRun
    Runs the what-if only, without deploying.

.PARAMETER PipelineMode
    Non-interactive: no confirmation prompt.

.PARAMETER Location
    Region where Azure stores the subscription deployment record. The resources' own region
    is the `location` parameter of the bicepparam file.

.EXAMPLE
    ./Deploy-BicepEnvironment.ps1 dev

.EXAMPLE
    ./Deploy-BicepEnvironment.ps1 prod -PipelineMode
#>
param(
    [Parameter(Mandatory, Position = 0)]
    [string]
    $Environment,

    [switch]
    $DryRun,

    [switch]
    $PipelineMode,

    [string]
    $Location = 'canadaeast'
)

$ErrorActionPreference = 'Stop'

$Environment = $Environment.ToLower()
$environmentFolder = Join-Path $PSScriptRoot 'Environment'
$templateFile = Join-Path $environmentFolder 'main.entrypoint.bicep'
$parametersFile = Join-Path $environmentFolder "main.$Environment.bicepparam"

if (-not (Test-Path -Path $parametersFile)) {
    $available = @(Get-ChildItem -Path $environmentFolder -Filter 'main.*.bicepparam' |
        ForEach-Object { $_.Name -replace '^main\.(.+)\.bicepparam$', '$1' })
    $availableText = if ($available.Count -gt 0) { $available -join ', ' } else { 'none' }
    throw "No parameters file for environment '$Environment' ($parametersFile). Available environments: $availableText."
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$deploymentArguments = @(
    'deployment', 'sub', 'create',
    '--name', "$Environment-deployment-$timestamp",
    '--location', $Location,
    '--template-file', $templateFile,
    '--parameters', $parametersFile
)

function Invoke-AzDeployment([string[]] $ExtraArguments) {
    az @deploymentArguments @ExtraArguments
    if ($LASTEXITCODE -ne 0) {
        throw "az deployment sub create failed with exit code $LASTEXITCODE."
    }
}

if ($DryRun) {
    Invoke-AzDeployment @('--what-if')
    return
}

if ($PipelineMode) {
    Invoke-AzDeployment @()
    return
}

Invoke-AzDeployment @('--what-if')

$choice = Read-Host -Prompt 'Do you want to continue? y to continue'
if ($choice -eq 'y') {
    Invoke-AzDeployment @()
}
