#Requires -Version 7.0
<#
.SYNOPSIS
    Starts a Zapper run in Azure Container Instances: the runner clones the base branch, prepares
    the sidecars, checks the approval gate and launches /goal on the run branch.

.DESCRIPTION
    Preflight mode does everything except /goal (clone, sidecars, setup, approval gate and a
    Copilot CLI smoke test): use it to validate the runner before the first real run.
    The secrets are read from the runner Key Vault and passed as secure parameters; they are
    written to a temporary parameters file that is deleted right after the deployment.

.EXAMPLE
    ./.zapper/runner/Start-ZapperRun.ps1 -Mode Preflight -Follow

.EXAMPLE
    ./.zapper/runner/Start-ZapperRun.ps1 -Follow
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [ValidateSet('Goal', 'Preflight')]
    [string] $Mode = 'Goal',
    # Branch holding the approved artifacts (default: the current branch, which must be pushed).
    [string] $BaseRef,
    # Branch of the run (default: zapper/<RunId>); an existing branch is resumed.
    [string] $Branch,
    [string] $RunId = "run-$(Get-Date -Format 'yyyyMMdd-HHmm')",
    [string] $ImageTag = 'latest',
    # Overrides runner.max-ai-credits.
    [int] $MaxAiCredits,
    # Streams the runner logs until the container stops.
    [switch] $Follow
)

. (Join-Path $PSScriptRoot 'runner-common.ps1')

$runner = Get-RunnerConfig
$defaultBranch = Get-ZapperValue 'default-branch'
if (-not $BaseRef) { $BaseRef = (git -C $script:RepositoryRoot branch --show-current).Trim() }
if (-not $Branch) { $Branch = "zapper/$RunId" }
if ($Branch -eq $defaultBranch) { throw "The run branch must not be the default branch ($defaultBranch)." }

if ($Mode -eq 'Goal') {
    Push-Location $script:RepositoryRoot
    try {
        node .zapper/scripts/goal-gate.mjs preflight
        if ($LASTEXITCODE -ne 0) { throw 'The approval gate refuses the run on this workspace: run workspace-check-zapper.' }
    }
    finally { Pop-Location }
}
git -C $script:RepositoryRoot fetch origin $BaseRef --quiet
$unpushed = git -C $script:RepositoryRoot rev-list --count "origin/$BaseRef..HEAD" 2>$null
if ($BaseRef -eq (git -C $script:RepositoryRoot branch --show-current).Trim() -and [int]$unpushed -gt 0) {
    Write-Warning "$unpushed local commit(s) of $BaseRef are not pushed: the runner clones origin/$BaseRef."
}

Select-RunnerSubscription $runner
$foundation = Get-RunnerFoundation $runner
$vault = $foundation.keyVaultName

$secureEnvironment = @{}
foreach ($entry in $runner.secrets.GetEnumerator()) { $secureEnvironment[$entry.Key] = Get-RunnerSecret $vault $entry.Value }
$sidecars = @()
$sidecarSecureEnvironment = @{}
foreach ($sidecar in @($runner.sidecars | Where-Object { $_ })) {
    $sidecars += @{ name = $sidecar.name; image = $sidecar.image; cpu = [int]$sidecar.cpu; memoryGb = [int]$sidecar.'memory-gb'; environment = ($sidecar.env ?? @{}) }
    $values = @{}
    foreach ($entry in ($sidecar.secrets ?? @{}).GetEnumerator()) { $values[$entry.Key] = Get-RunnerSecret $vault $entry.Value }
    $sidecarSecureEnvironment[$sidecar.name] = $values
}

$environment = [ordered]@{}
foreach ($entry in ($runner.env ?? @{}).GetEnumerator()) { $environment[$entry.Key] = "$($entry.Value)" }
$environment.ZAPPER_REPOSITORY = $runner.repository
$environment.ZAPPER_BASE_REF = $BaseRef
$environment.ZAPPER_BRANCH = $Branch
$environment.ZAPPER_RUN_ID = $RunId
$environment.ZAPPER_MODE = $Mode.ToLowerInvariant()
$environment.ZAPPER_MODEL = "$($runner.model)"
$environment.ZAPPER_MAX_AI_CREDITS = if ($MaxAiCredits) { "$MaxAiCredits" } else { "$($runner.'max-ai-credits')" }

$groupName = Get-ContainerGroupName $runner $RunId
$parameters = @{
    '$schema'      = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
    contentVersion = '1.0.0.0'
    parameters     = @{
        name                     = @{ value = $groupName }
        location                 = @{ value = $runner.azure.location }
        identityId               = @{ value = $foundation.identityId }
        registryLoginServer      = @{ value = $foundation.registryLoginServer }
        image                    = @{ value = "$($foundation.registryLoginServer)/zapper-runner:$ImageTag" }
        cpu                      = @{ value = [int]$runner.cpu }
        memoryGb                 = @{ value = [int]$runner.'memory-gb' }
        environment              = @{ value = $environment }
        secureEnvironment        = @{ value = $secureEnvironment }
        sidecars                 = @{ value = $sidecars }
        sidecarSecureEnvironment = @{ value = $sidecarSecureEnvironment }
        storageAccountName       = @{ value = $foundation.storageAccountName }
        shareName                = @{ value = $foundation.shareName }
    }
}

if (-not $PSCmdlet.ShouldProcess($groupName, "Start the $Mode run $RunId ($BaseRef -> $Branch)")) { return }
$parametersFile = New-TemporaryFile
try {
    $parameters | ConvertTo-Json -Depth 10 | Set-Content -Path $parametersFile -Encoding utf8NoBOM
    Invoke-Az deployment group create --resource-group $runner.azure.'resource-group' --name "zapper-$RunId" `
        --template-file (Join-Path $script:RunnerFolder 'infra' 'run.bicep') --parameters "@$parametersFile" | Out-Null
}
finally {
    Remove-Item $parametersFile -Force
    $secureEnvironment.Clear()
    $sidecarSecureEnvironment.Clear()
}

Write-Host "Run $RunId started in container group $groupName ($Mode, $BaseRef -> $Branch)."
Write-Host "Follow it:   ./.zapper/runner/Get-ZapperRun.ps1 -RunId $RunId -Follow"
Write-Host "Outputs:     ./.zapper/runner/Get-ZapperRun.ps1 -RunId $RunId -Download"
Write-Host "Clean up:    ./.zapper/runner/Remove-ZapperRun.ps1 -RunId $RunId"
if ($Follow) { & (Join-Path $PSScriptRoot 'Get-ZapperRun.ps1') -RunId $RunId -Follow }
