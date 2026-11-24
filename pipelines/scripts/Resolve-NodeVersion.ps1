param(
    [Parameter(Mandatory)]
    [string]$DirectoryPath,

    [string]$NodeVersion = ''
)

# Resolve version: prefer .nvmrc, fall back to configured pipeline version
$nvmrcPath = Join-Path $DirectoryPath '.nvmrc'
if (Test-Path $nvmrcPath) {
    $version = (Get-Content $nvmrcPath -Raw).Trim()
    Write-Host "Using Node.js version from .nvmrc: $version"
} elseif (-not [string]::IsNullOrWhiteSpace($NodeVersion)) {
    $version = $NodeVersion
    Write-Host "Using Node.js version from pipeline config: $version"
} else {
    Write-Error "No .nvmrc found at '$nvmrcPath' and no nodeVersion configured."
    exit 1
}

Write-Host "##vso[task.setvariable variable=resolvedNodeVersion]$version"
