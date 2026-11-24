#Requires -Version 7.0
<#
.SYNOPSIS
    Shows the state of a Zapper run, streams its logs or downloads its outputs (runner log,
    copy of .zapper/run, Copilot session export and logs, commits, exit code).

.EXAMPLE
    ./.zapper/runner/Get-ZapperRun.ps1 -RunId run-20261124-1530 -Follow

.EXAMPLE
    ./.zapper/runner/Get-ZapperRun.ps1 -RunId run-20261124-1530 -Download
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $RunId,
    [switch] $Follow,
    [switch] $Download,
    # Default: .zapper/runner-output/<RunId> (ignored by git).
    [string] $Destination
)

. (Join-Path $PSScriptRoot 'runner-common.ps1')

$runner = Get-RunnerConfig
Select-RunnerSubscription $runner
$resourceGroup = $runner.azure.'resource-group'
$groupName = Get-ContainerGroupName $runner $RunId

if ($Follow) {
    & az container logs --resource-group $resourceGroup --name $groupName --container-name runner --follow
}

$state = Invoke-Az container show --resource-group $resourceGroup --name $groupName `
    --query "{state: instanceView.state, runner: containers[?name=='runner'].instanceView.currentState | [0]}" -o json | ConvertFrom-Json
Write-Host "Run $RunId ($groupName): $($state.state); runner $($state.runner.state), exit code $($state.runner.exitCode)."

if ($Download) {
    $foundation = Get-RunnerFoundation $runner
    if (-not $Destination) { $Destination = Join-Path $script:RepositoryRoot '.zapper' 'runner-output' $RunId }
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    $env:AZURE_STORAGE_KEY = Invoke-Az storage account keys list --account-name $foundation.storageAccountName --query '[0].value' -o tsv
    try {
        Invoke-Az storage file download-batch --account-name $foundation.storageAccountName --source $foundation.shareName `
            --pattern "$RunId/*" --destination $Destination | Out-Null
    }
    finally { Remove-Item Env:AZURE_STORAGE_KEY }
    Write-Host "Outputs downloaded to $Destination."
}
