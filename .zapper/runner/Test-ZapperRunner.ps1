#Requires -Version 7.0
<#
.SYNOPSIS
    Runs the Zapper runner on this workstation with Docker, the way Azure Container Instances runs
    it: same image, sidecars sharing localhost, outputs in .zapper/runner-output/<RunId>.

.DESCRIPTION
    The repository is mounted read-only and copied with its uncommitted changes, so a runner change
    can be tested before it is pushed. Preflight mode (default) stops before /goal: it checks the
    image, the sidecars, the setup commands, the approval gate and Copilot CLI authentication.
    COPILOT_GITHUB_TOKEN comes from the environment or from `gh auth token`. The other secrets are
    passed with -Secret, keyed by their Key Vault secret name; a sidecar secret left out gets a
    random value.

.EXAMPLE
    ./.zapper/runner/Test-ZapperRunner.ps1 -Secret @{ 'sql-connection-string' = 'Server=127.0.0.1,1433;...' }
#>
[CmdletBinding()]
param(
    [ValidateSet('Goal', 'Preflight')]
    [string] $Mode = 'Preflight',
    [string] $RunId = "local-$(Get-Date -Format 'yyyyMMdd-HHmm')",
    [hashtable] $Secret = @{},
    # Reuse the image built by a previous test.
    [switch] $SkipBuild
)

. (Join-Path $PSScriptRoot 'runner-common.ps1')

$runner = Get-RunnerConfig -Local
$image = 'zapper-runner:local'
$prefix = "zapper-$RunId".ToLowerInvariant()
$output = Join-Path $script:RepositoryRoot '.zapper' 'runner-output'
New-Item -ItemType Directory -Force -Path $output | Out-Null

if (-not $SkipBuild) {
    $buildArgs = (Get-ImageBuildArgument $runner.image).GetEnumerator() | ForEach-Object { '--build-arg'; "$($_.Key)=$($_.Value)" }
    docker build -t $image @buildArgs $script:RunnerFolder
    if ($LASTEXITCODE -ne 0) { throw 'docker build failed.' }
}

function Resolve-Secret([string] $Name, [switch] $Generate) {
    if ($Secret.ContainsKey($Name)) { return $Secret[$Name] }
    if ($Generate) { return 'Zr1!' + [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(18)) }
    return $null
}

$token = $env:COPILOT_GITHUB_TOKEN ?? (gh auth token)
$envFiles = @()
$containers = @()
try {
    docker run -d --name "$prefix-pod" busybox sleep infinity | Out-Null
    $containers += "$prefix-pod"
    foreach ($sidecar in @($runner.sidecars | Where-Object { $_ })) {
        $file = New-TemporaryFile
        $envFiles += $file
        $lines = @()
        foreach ($entry in ($sidecar.env ?? @{}).GetEnumerator()) { $lines += "$($entry.Key)=$($entry.Value)" }
        foreach ($entry in ($sidecar.secrets ?? @{}).GetEnumerator()) {
            $value = Resolve-Secret $entry.Value -Generate
            $Secret[$entry.Value] = $value
            $lines += "$($entry.Key)=$value"
        }
        Set-Content -Path $file -Value $lines -Encoding utf8NoBOM
        docker run -d --name "$prefix-$($sidecar.name)" --network "container:$prefix-pod" --env-file $file `
            --memory "$($sidecar.'memory-gb')g" --cpus $sidecar.cpu $sidecar.image | Out-Null
        $containers += "$prefix-$($sidecar.name)"
    }

    $file = New-TemporaryFile
    $envFiles += $file
    $lines = @(
        "ZAPPER_REPOSITORY=/source", "ZAPPER_BASE_REF=$((git -C $script:RepositoryRoot branch --show-current).Trim())",
        "ZAPPER_BRANCH=zapper/$RunId", "ZAPPER_RUN_ID=$RunId", "ZAPPER_MODE=$($Mode.ToLowerInvariant())",
        "ZAPPER_MODEL=$($runner.model)", "ZAPPER_MAX_AI_CREDITS=$($runner.'max-ai-credits')", "COPILOT_GITHUB_TOKEN=$token"
    )
    foreach ($entry in ($runner.env ?? @{}).GetEnumerator()) { $lines += "$($entry.Key)=$($entry.Value)" }
    foreach ($entry in $runner.secrets.GetEnumerator()) {
        if ($entry.Key -in 'COPILOT_GITHUB_TOKEN', 'GIT_TOKEN') { continue }
        $value = Resolve-Secret $entry.Value
        if ($null -eq $value) { Write-Warning "No -Secret value for $($entry.Value) ($($entry.Key)): the variable is left unset." } else { $lines += "$($entry.Key)=$value" }
    }
    Set-Content -Path $file -Value $lines -Encoding utf8NoBOM

    docker run --rm --name "$prefix-runner" --network "container:$prefix-pod" --env-file $file `
        --memory "$($runner.'memory-gb')g" --cpus $runner.cpu `
        -v "$($script:RepositoryRoot):/source:ro" -v "$($output):/mnt/zapper" $image
    $exitCode = $LASTEXITCODE
    Write-Host "Runner exit code: $exitCode. Outputs: $(Join-Path $output $RunId)"
}
finally {
    $envFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    foreach ($name in $containers) { docker rm -f $name 2>&1 | Out-Null }
}
