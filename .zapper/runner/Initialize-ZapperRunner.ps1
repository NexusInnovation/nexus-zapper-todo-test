#Requires -Version 7.0
<#
.SYNOPSIS
    Prepares the Azure side of the Zapper runner: resource group, foundation (registry, identity,
    file share, Key Vault) and the runner image. Idempotent; run it again after a runner change.

.DESCRIPTION
    Reads the runner block of .zapper/config.md. The signed-in az user becomes Key Vault Secrets
    Officer of the runner vault. The secret values are never handled here: store them afterwards
    with `az keyvault secret set` (the script prints the names to set).

.EXAMPLE
    ./.zapper/runner/Initialize-ZapperRunner.ps1
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    # Tag of the image, in addition to latest.
    [string] $ImageTag = (Get-Date -Format 'yyyyMMdd-HHmm'),
    # Deploy the foundation only.
    [switch] $SkipImage
)

. (Join-Path $PSScriptRoot 'runner-common.ps1')

$runner = Get-RunnerConfig
Select-RunnerSubscription $runner
$resourceGroup = $runner.azure.'resource-group'

if ((Invoke-Az group exists --name $resourceGroup) -ne 'true') {
    if ($PSCmdlet.ShouldProcess($resourceGroup, 'Create the resource group')) {
        Invoke-Az group create --name $resourceGroup --location $runner.azure.location --tags purpose=zapper-runner | Out-Null
    }
}

$principalId = Invoke-Az ad signed-in-user show --query id -o tsv
if ($PSCmdlet.ShouldProcess($resourceGroup, 'Deploy the runner foundation')) {
    Invoke-Az deployment group create --resource-group $resourceGroup --name $script:FoundationDeployment `
        --template-file (Join-Path $script:RunnerFolder 'infra' 'foundation.bicep') `
        --parameters namePrefix=$($runner.azure.'name-prefix') location=$($runner.azure.location) vaultOfficerPrincipalId=$principalId | Out-Null
}
$foundation = Get-RunnerFoundation $runner
Write-Host "Foundation ready: registry $($foundation.registryLoginServer), vault $($foundation.keyVaultName)."

if (-not $SkipImage -and $PSCmdlet.ShouldProcess($foundation.registryName, "Build zapper-runner:$ImageTag")) {
    $buildArgs = (Get-ImageBuildArgument $runner.image).GetEnumerator() | ForEach-Object { '--build-arg'; "$($_.Key)=$($_.Value)" }
    Invoke-Az acr build --registry $foundation.registryName --image "zapper-runner:$ImageTag" --image 'zapper-runner:latest' `
        @buildArgs --file (Join-Path $script:RunnerFolder 'Dockerfile') $script:RunnerFolder | Out-Null
    Write-Host "Image built: $($foundation.registryLoginServer)/zapper-runner:$ImageTag (and latest)."
}

$secretNames = @($runner.secrets.Values) + @($runner.sidecars | Where-Object { $_ -and $_.secrets } | ForEach-Object { $_.secrets.Values })
$existing = @()
try { $existing = (Invoke-Az keyvault secret list --vault-name $foundation.keyVaultName --query '[].name' -o tsv) -split "`n" | Where-Object { $_ } }
catch { Write-Warning 'The vault cannot be listed yet (a new role assignment takes a few minutes); every secret is shown below.' }
$missing = $secretNames | Where-Object { $_ -notin $existing } | Sort-Object -Unique
if ($missing) {
    Write-Host ''
    Write-Host 'Store these secrets before the first run (the value is read from the prompt, never from history):' -ForegroundColor Yellow
    foreach ($name in $missing) {
        Write-Host "  az keyvault secret set --vault-name $($foundation.keyVaultName) --name $name --value (Read-Host -MaskInput '$name')"
    }
}
else {
    Write-Host 'Every secret of runner.secrets and runner.sidecars is stored.'
}
