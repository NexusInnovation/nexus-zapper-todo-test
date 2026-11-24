#Requires -Version 7.0
<#
.SYNOPSIS
    Deletes the container group of a Zapper run (or of every run). The outputs stay on the file
    share and the run branch stays on the remote.

.EXAMPLE
    ./.zapper/runner/Remove-ZapperRun.ps1 -RunId run-20261124-1530
#>
[CmdletBinding(SupportsShouldProcess, DefaultParameterSetName = 'One')]
param(
    [Parameter(Mandatory, ParameterSetName = 'One')]
    [string] $RunId,
    [Parameter(Mandatory, ParameterSetName = 'All')]
    [switch] $All
)

. (Join-Path $PSScriptRoot 'runner-common.ps1')

$runner = Get-RunnerConfig
Select-RunnerSubscription $runner
$resourceGroup = $runner.azure.'resource-group'

$names = if ($All) {
    (Invoke-Az container list --resource-group $resourceGroup --query "[?tags.purpose=='zapper-run'].name" -o tsv) -split "`n" | Where-Object { $_ }
}
else { @(Get-ContainerGroupName $runner $RunId) }

foreach ($name in $names) {
    if ($PSCmdlet.ShouldProcess($name, 'Delete the container group')) {
        Invoke-Az container delete --resource-group $resourceGroup --name $name --yes | Out-Null
        Write-Host "Deleted $name."
    }
}
