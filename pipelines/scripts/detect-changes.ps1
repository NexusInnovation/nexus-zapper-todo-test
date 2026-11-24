# These functions define the naming convention for all pipeline output variables set by this script.
# Any YAML template referencing these variables must use the same pattern.
function Get-InfraVariableName { return 'infraChanged' }
function Get-AnyDeployVariableName { return 'anyDeployOrForce' }
function Get-AppVariableName([string]$applicationKey, [string]$property) {
  return "app_${applicationKey}_${property}"
}
function Get-ComponentVariableName([string]$applicationKey, [string]$componentKey, [string]$property) {
  return "app_${applicationKey}_comp_${componentKey}_${property}"
}

function Get-ChangedFilesMatchingPrefixes([string[]]$changedFiles, [string[]]$pathPrefixes) {
  if ($null -eq $pathPrefixes -or $pathPrefixes.Count -eq 0) { return $false }
  foreach ($file in $changedFiles) {
    foreach ($rawFilter in $pathPrefixes) {
      if ([string]::IsNullOrWhiteSpace($rawFilter)) { continue }
      $filter = $rawFilter.Replace('\\', '/').Trim()
      if ($filter.EndsWith('/')) {
        # Folder prefix with explicit trailing slash
        if ($file.StartsWith($filter, [System.StringComparison]::OrdinalIgnoreCase)) {
          return $true
        }
      } else {
        # Exact file match, or folder prefix without trailing slash
        if ($file -ieq $filter -or $file.StartsWith("$filter/", [System.StringComparison]::OrdinalIgnoreCase)) {
          return $true
        }
      }
    }
  }
  return $false
}

function Resolve-RepoRelativePath([string]$baseDir, [string]$relativePath) {
  $parts = ($baseDir.Replace('\', '/').TrimEnd('/') + '/' + $relativePath.Replace('\', '/')).Split('/')
  $result = [System.Collections.Generic.List[string]]::new()
  foreach ($part in $parts) {
    if ($part -eq '..') {
      if ($result.Count -gt 0) { $result.RemoveAt($result.Count - 1) }
    } elseif ($part -ne '.' -and $part -ne '') {
      $result.Add($part)
    }
  }
  return $result -join '/'
}

function Get-NormalizedName([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return 'application' }
  $key = $name.ToLowerInvariant()
  $key = $key.Replace('-', '_').Replace(' ', '_')
  if ([string]::IsNullOrWhiteSpace($key)) { return 'application' }
  return $key
}

function Get-JsonVariable([string]$name) {
  $envVar = Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue
  if ($null -eq $envVar) {
    throw "Environment variable '$name' is required but is not set."
  }
  $val = $envVar.Value
  if ([string]::IsNullOrWhiteSpace($val)) {
    throw "Environment variable '$name' is set but is empty or whitespace, which is not allowed."
  }
  try {
    $result = $val | ConvertFrom-Json
    if ($null -eq $result) {
      throw "Environment variable '$name' parsed to null but is required."
    }
    return $result
  } catch {
    throw "Failed to parse environment variable '$name' as JSON: $_"
  }
}

function Get-ChangedFiles([string]$buildReason) {
  if ($buildReason -eq 'PullRequest') {
    $targetRef = [string]$env:SYSTEM_PULLREQUEST_TARGETBRANCH
    $targetName = $targetRef -replace '^refs/heads/', ''
    Write-Host "PR target branch: $targetName"
    return @(git diff --name-only "origin/$targetName...HEAD" | Where-Object { $_ })
  }

  # NOTE: For non-PR builds we diff only the latest commit (HEAD~1..HEAD).
  # This assumes squash merges — one commit per merge to main.
  # If multiple commits can land at once or non-squash merges are used,
  # this may miss changes introduced before the last commit.
  return @(git diff --name-only HEAD~1..HEAD | Where-Object { $_ })
}

function Set-InfraFlags([string[]]$changedFiles) {
  $infrastructureFilters = Get-JsonVariable -name "INFRASTRUCTURE_FILTERS_JSON"
  $infraChanged = Get-ChangedFilesMatchingPrefixes -changedFiles $changedFiles -pathPrefixes $infrastructureFilters
  $varName = Get-InfraVariableName
  $val = $infraChanged.ToString().ToLowerInvariant()
  Write-Host "$varName=$val"
  Write-Host "##vso[task.setvariable variable=$varName;isOutput=true]$val"
}

function Set-ComponentVariables($applicationKey, $componentStatus, $applicationChanged, $forceBuildAndDeploy, $buildReason) {
  $compName = [string]$componentStatus.ComponentName.name
  $compKey = $componentStatus.Key
  $compChanged = $componentStatus.Changed
  
  $compShouldProcess = $forceBuildAndDeploy -or ($buildReason -eq 'PullRequest' -and $compChanged) -or ($buildReason -ne 'PullRequest' -and $applicationChanged)

  $changedVal = $compChanged.ToString().ToLowerInvariant()
  $shouldProcessVal = $compShouldProcess.ToString().ToLowerInvariant()
  Write-Host "  [$compName] changed=$changedVal, shouldProcess=$shouldProcessVal"
  $changedVar = Get-ComponentVariableName -applicationKey $applicationKey -componentKey $compKey -property 'changed'
  $shouldProcessVar = Get-ComponentVariableName -applicationKey $applicationKey -componentKey $compKey -property 'shouldProcess'
  Write-Host "##vso[task.setvariable variable=$changedVar;isOutput=true]$changedVal"
  Write-Host "##vso[task.setvariable variable=$shouldProcessVar;isOutput=true]$shouldProcessVal"
}

function Get-ComponentStatus($comp, $changedFiles, $pipelineFilters, $templatesCommonDir) {
  $filters = @($comp.componentFilters) + @($pipelineFilters)

  if (![string]::IsNullOrWhiteSpace([string]$comp.buildTemplate)) {
    $filters += Resolve-RepoRelativePath $templatesCommonDir ([string]$comp.buildTemplate)
  }
  if (![string]::IsNullOrWhiteSpace([string]$comp.deployTemplate)) {
    $filters += Resolve-RepoRelativePath $templatesCommonDir ([string]$comp.deployTemplate)
  }

  $isChanged = Get-ChangedFilesMatchingPrefixes -changedFiles $changedFiles -pathPrefixes $filters
  $componentStatus = [pscustomobject]@{
    ComponentName = $comp
    Key = Get-NormalizedName ([string]$comp.name)
    Changed = $isChanged
  }

  return $componentStatus
}

function Set-ApplicationFlags($application, [string[]]$changedFiles, [string[]]$pipelineFilters, [string]$buildReason, [string]$templatesCommonDir) {
  $applicationName = [string]$application.name
  $applicationKey = Get-NormalizedName $applicationName
  $forceBuildAndDeploy = if ($null -ne $application.forceBuildAndDeploy) { [System.Convert]::ToBoolean($application.forceBuildAndDeploy) } else { $false }

  $componentStatuses = @()
  if ($application.components) {
    foreach ($comp in $application.components) {
      $componentStatuses += Get-ComponentStatus -comp $comp -changedFiles $changedFiles -pipelineFilters $pipelineFilters -templatesCommonDir $templatesCommonDir
    }
  }

  $appFilters = @($application.applicationFilters)
  $appBaseChanged = Get-ChangedFilesMatchingPrefixes -changedFiles $changedFiles -pathPrefixes @($appFilters + $pipelineFilters)
  $anyCompChanged = ($componentStatuses | Where-Object { $_.Changed }).Count -gt 0
  $applicationChanged = $appBaseChanged -or $anyCompChanged -or $forceBuildAndDeploy
  $appChangedVal = $applicationChanged.ToString().ToLowerInvariant()
  Write-Host "[$applicationName] applicationChanged=$appChangedVal (base=$appBaseChanged, anyComp=$anyCompChanged, force=$forceBuildAndDeploy)"
  $appChangedVar = Get-AppVariableName -applicationKey $applicationKey -property 'applicationChanged'
  Write-Host "##vso[task.setvariable variable=$appChangedVar;isOutput=true]$appChangedVal"

  foreach ($status in $componentStatuses) {
    Set-ComponentVariables -applicationKey $applicationKey -componentStatus $status -applicationChanged $applicationChanged -forceBuildAndDeploy $forceBuildAndDeploy -buildReason $buildReason
  }

  return [pscustomobject]@{ ApplicationChanged = $applicationChanged }
}

function Set-FlagsForAllApplications([string[]]$changedFiles, [string]$buildReason, [string]$templatesCommonDir) {
  $applications = Get-JsonVariable -name "APPLICATIONS_JSON"
  $pipelineFilters = Get-JsonVariable -name "PIPELINE_FILTERS_JSON"
  $anyDeployOrForce = $false

  foreach ($app in $applications) {
    $result = Set-ApplicationFlags -application $app -changedFiles $changedFiles -pipelineFilters $pipelineFilters -buildReason $buildReason -templatesCommonDir $templatesCommonDir
    $anyDeployOrForce = $anyDeployOrForce -or $result.ApplicationChanged
  }
  
  $anyDeployVal = $anyDeployOrForce.ToString().ToLowerInvariant()
  Write-Host "anyDeployOrForce=$anyDeployVal"
  $anyDeployVar = Get-AnyDeployVariableName
  Write-Host "##vso[task.setvariable variable=$anyDeployVar;isOutput=true]$anyDeployVal"
}

git --version | Out-Host
git fetch --all --prune | Out-Host

$templatesCommonDir = [string]$env:TEMPLATES_COMMON_DIRECTORY
Write-Host "Templates common directory: $templatesCommonDir"

$buildReason = [string]$env:BUILD_REASON
Write-Host "Build.Reason=$buildReason"

$changedFiles = Get-ChangedFiles -buildReason $buildReason
Write-Host "Changed files count: $($changedFiles.Count)"
if ($changedFiles.Count -gt 0) { $changedFiles | ForEach-Object { Write-Host " - $_" } }

Set-InfraFlags -changedFiles $changedFiles
Set-FlagsForAllApplications -changedFiles $changedFiles -buildReason $buildReason -templatesCommonDir $templatesCommonDir
