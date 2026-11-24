# Library of the Zapper runner scripts (dot-sourced, never run directly).
#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
# az (Python) otherwise writes with cp1252 and crashes on non-ASCII responses.
$env:PYTHONIOENCODING = 'utf-8'

$script:RunnerFolder = $PSScriptRoot
$script:RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
$script:FoundationDeployment = 'zapper-runner-foundation'

function Get-ZapperValue([string] $Path) {
    $configScript = Join-Path $script:RepositoryRoot '.zapper' 'scripts' 'zapper-config.mjs'
    Push-Location $script:RepositoryRoot
    try {
        $output = node $configScript $Path 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Cannot read '$Path' from .zapper/config.md: $output" }
    }
    finally { Pop-Location }
    $text = ($output -join "`n").Trim()
    if ($text.StartsWith('{') -or $text.StartsWith('[')) { return $text | ConvertFrom-Json -AsHashtable }
    return $text
}

function Get-RunnerConfig([switch] $Local) {
    $runner = Get-ZapperValue 'runner'
    if ($runner -isnot [hashtable]) { throw '.zapper/config.md has no runner block (runner: none): runs stay on a workstation.' }
    $checked = $runner.Clone()
    if ($Local) { $checked.Remove('azure') }
    $placeholders = ($checked | ConvertTo-Json -Depth 10) | Select-String -Pattern '"<[^"]*>"' -AllMatches
    if ($placeholders) { throw "runner still has placeholders in .zapper/config.md: $($placeholders.Matches.Value -join ', ')" }
    foreach ($name in 'COPILOT_GITHUB_TOKEN', 'GIT_TOKEN') {
        if (-not $runner.secrets -or -not $runner.secrets.ContainsKey($name)) { throw "runner.secrets must name the Key Vault secret of $name." }
    }
    $cpu = [double]$runner.cpu
    $memory = [double]$runner.'memory-gb'
    foreach ($sidecar in @($runner.sidecars | Where-Object { $_ })) {
        $cpu += [double]$sidecar.cpu
        $memory += [double]$sidecar.'memory-gb'
    }
    if ($cpu -gt 4 -or $memory -gt 16) { Write-Warning "The runner and its sidecars request $cpu vCPU and $memory GB; most regions cap a container group at 4 vCPU and 16 GB." }
    return $runner
}

function Get-OptionalValue($Value) {
    if ($null -eq $Value -or "$Value" -eq 'none') { return '' }
    return "$Value"
}

function Get-ImageBuildArgument([hashtable] $Image) {
    [ordered]@{
        BASE_IMAGE      = Get-OptionalValue $Image.base
        DOTNET_CHANNEL  = if (Get-OptionalValue $Image.'dotnet-channel') { $Image.'dotnet-channel' } else { 'none' }
        DOTNET_TOOLS    = Get-OptionalValue $Image.'dotnet-tools'
        PNPM_VERSION    = if (Get-OptionalValue $Image.'pnpm-version') { $Image.'pnpm-version' } else { 'none' }
        COPILOT_VERSION = if (Get-OptionalValue $Image.'copilot-version') { $Image.'copilot-version' } else { 'latest' }
        APT_PACKAGES    = Get-OptionalValue $Image.'apt-packages'
    }
}

function Invoke-Az {
    $output = & az @args 2>&1
    if ($LASTEXITCODE -ne 0) { throw "az $($args -join ' ') failed: $($output -join "`n")" }
    return ($output | Where-Object { $_ -is [string] }) -join "`n"
}

function Select-RunnerSubscription([hashtable] $Runner) {
    Invoke-Az account set --subscription $Runner.azure.subscription | Out-Null
}

function Get-RunnerFoundation([hashtable] $Runner) {
    $json = Invoke-Az deployment group show --resource-group $Runner.azure.'resource-group' --name $script:FoundationDeployment --query properties.outputs -o json
    $outputs = $json | ConvertFrom-Json -AsHashtable
    $result = @{}
    foreach ($key in $outputs.Keys) { $result[$key] = $outputs[$key].value }
    return $result
}

function Get-RunnerSecret([string] $VaultName, [string] $SecretName) {
    $value = Invoke-Az keyvault secret show --vault-name $VaultName --name $SecretName --query value -o tsv
    if (-not $value) { throw "Key Vault $VaultName has no value for the secret $SecretName." }
    return $value
}

function Get-ContainerGroupName([hashtable] $Runner, [string] $RunId) {
    return "$($Runner.azure.'name-prefix')-$RunId".ToLowerInvariant()
}
