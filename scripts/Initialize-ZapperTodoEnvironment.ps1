#Requires -Version 7.0
<#
.SYNOPSIS
    Automates the remaining one-time setup of zapper-todo: Entra ID groups, Key Vault admins,
    Azure DevOps environments, service connections, pipeline, and an optional infra deployment.

.DESCRIPTION
    Run it without parameters from anywhere in the repository. Every value is chosen from a
    list (Azure subscriptions, users, GitHub connections...) whenever possible, and every
    change is confirmed before it is made. Each step is idempotent: re-running it skips
    what already exists.

.EXAMPLE
    ./scripts/Initialize-ZapperTodoEnvironment.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
# az (Python) otherwise writes with cp1252 and crashes on non-ASCII responses.
$env:PYTHONIOENCODING = 'utf-8'

$repoRoot = Split-Path $PSScriptRoot -Parent
$environmentFolder = Join-Path $repoRoot 'infra' 'Environment'
$applicationName = 'zapper-todo'
$serviceConnectionPrefix = 'sc-nexus-zapper-todo'
$pipelineName = 'nexus-zapper-todo'
$pipelineYamlPath = 'pipelines/azure-pipelines.yml'
$location = 'canadaeast'
$devOpsResource = '499b84ac-1321-427f-aa17-267ca6975798'
$environmentNames = @{ dev = 'Dev'; uat = 'Uat'; prod = 'Prod' }

#region Helpers

function Write-Step([string] $Title) {
    Write-Host ''
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Confirm-Action([string] $Message) {
    do { $answer = (Read-Host "$Message [o/n]").Trim().ToLower() } while ($answer -notin 'o', 'oui', 'y', 'yes', 'n', 'non', 'no')
    return $answer -in 'o', 'oui', 'y', 'yes'
}

# Picks items from a list: grid window when available, numbered console menu otherwise.
function Select-Item {
    param(
        [Parameter(Mandatory)] [AllowEmptyCollection()] [object[]] $Items,
        [Parameter(Mandatory)] [string] $Title,
        [Parameter(Mandatory)] [scriptblock] $Label,
        [switch] $Multiple
    )
    if ($Items.Count -eq 0) { return @() }
    $rows = for ($i = 0; $i -lt $Items.Count; $i++) {
        [pscustomobject]@{ '#' = $i + 1; Choix = (& $Label $Items[$i]) }
    }
    $mode = if ($Multiple) { 'Multiple' } else { 'Single' }
    $picked = $null
    if (Get-Command Out-ConsoleGridView -ErrorAction SilentlyContinue) {
        $picked = $rows | Out-ConsoleGridView -Title $Title -OutputMode $mode
    }
    elseif ($IsWindows -and (Get-Command Out-GridView -ErrorAction SilentlyContinue)) {
        $picked = $rows | Out-GridView -Title $Title -OutputMode $mode
    }
    else {
        Write-Host $Title -ForegroundColor Yellow
        $rows | ForEach-Object { Write-Host ("  {0,3}. {1}" -f $_.'#', $_.Choix) }
        $hint = if ($Multiple) { 'numéros séparés par des virgules, vide pour aucun' } else { 'numéro' }
        $raw = Read-Host "Choix ($hint)"
        $numbers = @($raw -split '[,\s]+' | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ })
        $picked = $rows | Where-Object { $numbers -contains $_.'#' }
        if (-not $Multiple) { $picked = $picked | Select-Object -First 1 }
    }
    return @($picked | ForEach-Object { $Items[$_.'#' - 1] })
}

# Plain function on purpose: an advanced one would bind az flags like -o to common parameters.
function Invoke-Az {
    $Arguments = [string[]]$args
    $output = az @Arguments --only-show-errors 2>&1
    if ($LASTEXITCODE -ne 0) { throw "az $($Arguments -join ' ') a échoué :`n$output" }
    $text = ($output | Where-Object { $_ -is [string] }) -join "`n"
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    try { return $text | ConvertFrom-Json -Depth 50 } catch { return $text.Trim() }
}

function Invoke-DevOps {
    param(
        [Parameter(Mandatory)] [ValidateSet('get', 'post', 'patch')] [string] $Method,
        [Parameter(Mandatory)] [string] $Url,
        [object] $Body
    )
    $arguments = @('rest', '--method', $Method, '--url', $Url, '--resource', $devOpsResource)
    $bodyFile = $null
    if ($null -ne $Body) {
        # A file avoids the Windows quoting issues of inline JSON.
        $bodyFile = New-TemporaryFile
        $Body | ConvertTo-Json -Depth 20 | Set-Content -Path $bodyFile -Encoding utf8NoBOM
        $arguments += @('--body', "@$bodyFile", '--headers', 'Content-Type=application/json')
    }
    try { return Invoke-Az @arguments }
    finally { if ($bodyFile) { Remove-Item $bodyFile -ErrorAction SilentlyContinue } }
}

function Find-User([string] $Purpose) {
    $selected = @()
    while ($true) {
        $search = Read-Host "$Purpose — début du nom ou courriel à chercher (vide pour terminer)"
        if ([string]::IsNullOrWhiteSpace($search)) { break }
        $escaped = $search.Replace("'", "''")
        $filter = "startswith(displayName,'$escaped') or startswith(userPrincipalName,'$escaped') or startswith(mail,'$escaped')"
        $users = @(Invoke-Az ad user list --filter $filter --query '[].{id:id, name:displayName, upn:userPrincipalName}' -o json)
        if ($users.Count -eq 0) { Write-Host '  Aucun utilisateur trouvé.' -ForegroundColor DarkYellow; continue }
        $selected += Select-Item -Items $users -Multiple -Title "$Purpose — sélectionnez" -Label { param($u) "$($u.name) <$($u.upn)>" }
    }
    return @($selected | Sort-Object id -Unique)
}

function Get-ParamFile([string] $Environment) { Join-Path $environmentFolder "main.$Environment.bicepparam" }

function Set-BicepParamLine([string] $Environment, [string] $Pattern, [string] $Replacement) {
    $file = Get-ParamFile $Environment
    $content = Get-Content -Path $file -Raw
    $updated = [regex]::Replace($content, $Pattern, $Replacement.Replace('$', '$$'))
    if ($updated -ne $content) {
        Set-Content -Path $file -Value $updated -NoNewline -Encoding utf8NoBOM
        Write-Host "  $([System.IO.Path]::GetFileName($file)) mis à jour." -ForegroundColor Green
    }
}

#endregion

#region Prerequisites and context

Write-Step 'Prérequis'
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Azure CLI (az) introuvable. Installez-la : https://aka.ms/installazurecli' }
if (-not (Invoke-Az extension list --query "[?name=='azure-devops'].name" -o json)) {
    Write-Host "  Installation de l'extension azure-devops..."
    Invoke-Az extension add --name azure-devops | Out-Null
}

$account = $null
try { $account = Invoke-Az account show -o json } catch { $account = $null }
if (-not $account) {
    Write-Host '  Connexion Azure (le navigateur va s''ouvrir)...'
    Invoke-Az login -o none | Out-Null
}

$subscriptions = @(Invoke-Az account list --query '[?state==''Enabled''].{id:id, name:name, tenantId:tenantId, isDefault:isDefault}' -o json)
$subscription = Select-Item -Items $subscriptions -Title 'Abonnement Azure cible' -Label { param($s) "$($s.name) ($($s.id))$(if ($s.isDefault) { ' [actuel]' })" } | Select-Object -First 1
if (-not $subscription) { throw 'Aucun abonnement sélectionné.' }
Invoke-Az account set --subscription $subscription.id | Out-Null
$tenantId = $subscription.tenantId
$me = Invoke-Az ad signed-in-user show --query '{id:id, upn:userPrincipalName}' -o json
Write-Host "  Connecté : $($me.upn) — abonnement $($subscription.name)" -ForegroundColor Green

$environments = @(Select-Item -Items @('dev', 'uat', 'prod') -Multiple -Title 'Environnements à préparer' -Label { param($e) $e })
if ($environments.Count -eq 0) { throw 'Aucun environnement sélectionné.' }

$allSteps = @(
    'Groupes Entra ID *-sql-admins (création, membres, object ID dans les .bicepparam)'
    'Administrateurs du Key Vault (kvAdminIds dans les .bicepparam)'
    'Environnements Azure DevOps (approbations)'
    'Service connections Azure DevOps (identité fédérée, rôles, groupe SQL)'
    'Pipeline Azure DevOps (dépôt GitHub)'
    'Déploiement de l''infrastructure (what-if puis déploiement)'
)
$steps = @(Select-Item -Items $allSteps -Multiple -Title 'Étapes à exécuter' -Label { param($s) $s })

# Azure DevOps organization and project come from the repository's saved skill inputs.
$devOpsOrg = 'nexusinno'; $devOpsProject = 'ZapperTodo'
$inputsFile = Join-Path $repoRoot '.nexus' 'skill-inputs.yml'
if (Test-Path $inputsFile) {
    $yaml = Get-Content $inputsFile -Raw
    if ($yaml -match '(?m)^\s+organization:\s*(\S+)') { $devOpsOrg = $Matches[1] }
    if ($yaml -match '(?m)^\s+project:\s*(\S+)') { $devOpsProject = $Matches[1] }
}
$orgUrl = "https://dev.azure.com/$devOpsOrg"

$sqlGroupIds = @{}

#endregion

#region 1. SQL admin groups

if ($steps -contains $allSteps[0]) {
    Write-Step 'Groupes Entra ID des administrateurs SQL'
    foreach ($env in $environments) {
        $groupName = "$applicationName-$env-sql-admins"
        $group = Invoke-Az ad group list --display-name $groupName --query '[0].{id:id, name:displayName}' -o json
        if (-not $group) {
            if (-not (Confirm-Action "Créer le groupe '$groupName' ?")) { continue }
            $group = Invoke-Az ad group create --display-name $groupName --mail-nickname $groupName --description "Administrateurs Entra ID du serveur SQL $applicationName ($env)" --query '{id:id, name:displayName}' -o json
            Write-Host "  Groupe créé : $($group.id)" -ForegroundColor Green
        }
        else { Write-Host "  '$groupName' existe déjà ($($group.id))." }
        $sqlGroupIds[$env] = $group.id

        $members = Find-User "Membres de $groupName"
        foreach ($member in $members) {
            $isMember = Invoke-Az ad group member check --group $group.id --member-id $member.id --query value -o json
            if (-not $isMember) { Invoke-Az ad group member add --group $group.id --member-id $member.id | Out-Null; Write-Host "  + $($member.name)" -ForegroundColor Green }
        }

        Set-BicepParamLine $env "param sqlAdminGroupObjectId = '[^']*'.*" "param sqlAdminGroupObjectId = '$($group.id)'"
    }
}

#endregion

#region 2. Key Vault administrators

if ($steps -contains $allSteps[1]) {
    Write-Step 'Administrateurs du Key Vault (Key Vault Secrets Officer)'
    foreach ($env in $environments) {
        $admins = @(Find-User "Admins Key Vault ($env)")
        if ($admins.Count -eq 0) { Write-Host "  $env : inchangé."; continue }
        $list = ($admins | ForEach-Object { "  '$($_.id)' // $($_.name)" }) -join "`n"
        $pattern = "(?m)(^// TODO: object IDs of the (people|developers) who manage the Key Vault secrets.*\r?\n)?^param kvAdminIds = \[[^\]]*\]"
        Set-BicepParamLine $env $pattern "param kvAdminIds = [`n$list`n]"
    }
}

#endregion

#region Azure DevOps context

$needsDevOps = ($steps -contains $allSteps[2]) -or ($steps -contains $allSteps[3]) -or ($steps -contains $allSteps[4])
if ($needsDevOps) {
    Write-Step "Azure DevOps : $orgUrl / $devOpsProject"
    Invoke-Az devops configure --defaults organization=$orgUrl project=$devOpsProject | Out-Null
    $project = Invoke-Az devops project show --project $devOpsProject --org $orgUrl --query '{id:id, name:name}' -o json
    $projectApi = "$orgUrl/$($project.id)/_apis"
}

#endregion

#region 3. Azure DevOps environments

if ($steps -contains $allSteps[2]) {
    Write-Step 'Environnements Azure DevOps'
    $existing = @((Invoke-DevOps get "$projectApi/distributedtask/environments?api-version=7.1").value.name)
    foreach ($env in $environments) {
        $name = $environmentNames[$env]
        if ($existing -contains $name) { Write-Host "  '$name' existe déjà."; continue }
        Invoke-DevOps post "$projectApi/distributedtask/environments?api-version=7.1" @{ name = $name; description = "$applicationName $env" } | Out-Null
        Write-Host "  '$name' créé." -ForegroundColor Green
    }
    if ($environments -contains 'prod' -and (Confirm-Action 'Ouvrir la page des environnements pour ajouter une approbation sur Prod ?')) {
        Start-Process "$orgUrl/$devOpsProject/_environments"
    }
}

#endregion

#region 4. Service connections

if ($steps -contains $allSteps[3]) {
    Write-Step 'Service connections (fédération d''identité de charge de travail)'
    Write-Host "  Rôles accordés à chaque connexion : Contributor sur l'abonnement (déploiement Bicep au niveau abonnement)"
    Write-Host "  et Role Based Access Control Administrator sur le groupe de ressources (rôles Key Vault)."
    $endpoints = @((Invoke-DevOps get "$projectApi/serviceendpoint/endpoints?api-version=7.1").value)

    foreach ($env in $environments) {
        $connectionName = "$serviceConnectionPrefix-$env"
        $resourceGroup = "$applicationName-$env-rg"
        if (-not (Confirm-Action "Préparer la service connection '$connectionName' ?")) { continue }

        $app = Invoke-Az ad app list --display-name $connectionName --query '[0].{appId:appId, id:id}' -o json
        if (-not $app) {
            $app = Invoke-Az ad app create --display-name $connectionName --sign-in-audience AzureADMyOrg --query '{appId:appId, id:id}' -o json
            Write-Host "  Inscription d'application créée : $($app.appId)" -ForegroundColor Green
        }
        $sp = Invoke-Az ad sp list --filter "appId eq '$($app.appId)'" --query '[0].{id:id}' -o json
        if (-not $sp) { $sp = Invoke-Az ad sp create --id $app.appId --query '{id:id}' -o json }

        $endpoint = $endpoints | Where-Object name -eq $connectionName | Select-Object -First 1
        if (-not $endpoint) {
            $endpoint = Invoke-DevOps post "$orgUrl/_apis/serviceendpoint/endpoints?api-version=7.1" @{
                name                             = $connectionName
                type                             = 'azurerm'
                url                              = 'https://management.azure.com/'
                description                      = "$applicationName $env"
                authorization                    = @{ scheme = 'WorkloadIdentityFederation'; parameters = @{ tenantid = $tenantId; serviceprincipalid = $app.appId } }
                data                             = @{ environment = 'AzureCloud'; scopeLevel = 'Subscription'; subscriptionId = $subscription.id; subscriptionName = $subscription.name; creationMode = 'Manual' }
                isShared                         = $false
                isReady                          = $true
                serviceEndpointProjectReferences = @(@{ projectReference = @{ id = $project.id; name = $project.name }; name = $connectionName })
            }
            Write-Host "  Service connection créée." -ForegroundColor Green
        }
        else { Write-Host "  '$connectionName' existe déjà." }

        $issuer = $endpoint.authorization.parameters.workloadIdentityFederationIssuer
        $subject = $endpoint.authorization.parameters.workloadIdentityFederationSubject
        $credentials = @(Invoke-Az ad app federated-credential list --id $app.appId --query '[].subject' -o json)
        if ($subject -and $credentials -notcontains $subject) {
            $credentialFile = New-TemporaryFile
            @{ name = "azdo-$connectionName"; issuer = $issuer; subject = $subject; audiences = @('api://AzureADTokenExchange') } |
                ConvertTo-Json | Set-Content -Path $credentialFile -Encoding utf8NoBOM
            try { Invoke-Az ad app federated-credential create --id $app.appId --parameters "@$credentialFile" | Out-Null }
            finally { Remove-Item $credentialFile -ErrorAction SilentlyContinue }
            Write-Host '  Identifiant fédéré ajouté.' -ForegroundColor Green
        }

        Invoke-Az group create --name $resourceGroup --location $location -o none | Out-Null
        $assignments = @(
            @{ role = 'Contributor'; scope = "/subscriptions/$($subscription.id)" }
            @{ role = 'Role Based Access Control Administrator'; scope = "/subscriptions/$($subscription.id)/resourceGroups/$resourceGroup" }
        )
        foreach ($assignment in $assignments) {
            $found = Invoke-Az role assignment list --assignee $sp.id --role $assignment.role --scope $assignment.scope --query '[0].id' -o json
            if (-not $found) {
                Invoke-Az role assignment create --assignee-object-id $sp.id --assignee-principal-type ServicePrincipal --role $assignment.role --scope $assignment.scope -o none | Out-Null
                Write-Host "  Rôle '$($assignment.role)' accordé." -ForegroundColor Green
            }
        }

        $groupId = $sqlGroupIds[$env]
        if (-not $groupId) { $groupId = Invoke-Az ad group list --display-name "$applicationName-$env-sql-admins" --query '[0].id' -o json }
        if ($groupId) {
            $isMember = Invoke-Az ad group member check --group $groupId --member-id $sp.id --query value -o json
            if (-not $isMember) { Invoke-Az ad group member add --group $groupId --member-id $sp.id | Out-Null; Write-Host '  Ajoutée au groupe des admins SQL.' -ForegroundColor Green }
        }
        else { Write-Host "  Groupe $applicationName-$env-sql-admins introuvable : relancez l'étape 1 puis celle-ci." -ForegroundColor DarkYellow }

        if (Confirm-Action "  Autoriser tous les pipelines du projet à utiliser '$connectionName' ?") {
            Invoke-DevOps patch "$projectApi/pipelines/pipelinePermissions/endpoint/$($endpoint.id)?api-version=7.1-preview.1" @{ allPipelines = @{ authorized = $true } } | Out-Null
        }
    }
}

#endregion

#region 5. Pipeline

if ($steps -contains $allSteps[4]) {
    Write-Step 'Pipeline Azure DevOps'
    # Filtered here: an '&' in the URL is split by cmd.exe when az.cmd runs.
    function Get-GitHubConnection {
        @((Invoke-DevOps get "$projectApi/serviceendpoint/endpoints?api-version=7.1").value | Where-Object { $_.type -eq 'github' })
    }
    $existingPipeline = Invoke-Az pipelines list --name $pipelineName --query '[0].id' -o json
    if ($existingPipeline) { Write-Host "  Le pipeline '$pipelineName' existe déjà (id $existingPipeline)." }
    else {
        $remote = (git -C $repoRoot remote get-url origin).Trim() -replace '\.git$', ''
        $github = @(Get-GitHubConnection)
        while ($github.Count -eq 0) {
            Write-Host '  Aucune service connection GitHub dans le projet. La page va s''ouvrir : créez-en une (OAuth ou GitHub App), puis revenez ici.' -ForegroundColor DarkYellow
            Start-Process "$orgUrl/$devOpsProject/_settings/adminservices"
            if (-not (Confirm-Action '  Connexion GitHub créée ? (n pour passer cette étape)')) { break }
            $github = @(Get-GitHubConnection)
        }
        if ($github.Count -eq 0) {
            Write-Host '  Toujours aucune connexion GitHub : étape Pipeline ignorée. Dans la page, choisissez « Nouvelle connexion de service » > GitHub, puis relancez le script.' -ForegroundColor DarkYellow
        }
        $githubConnection = Select-Item -Items $github -Title 'Service connection GitHub' -Label { param($e) $e.name } | Select-Object -First 1
        if ($githubConnection) {
            $branch = (Select-Item -Items @('main', 'develop') -Title 'Branche par défaut du pipeline' -Label { param($b) $b } | Select-Object -First 1) ?? 'main'
            Invoke-Az pipelines create --name $pipelineName --repository $remote --repository-type github --branch $branch `
                --yml-path $pipelineYamlPath --service-connection $githubConnection.id --skip-first-run true -o none | Out-Null
            Write-Host "  Pipeline '$pipelineName' créé." -ForegroundColor Green
            if (Confirm-Action '  Ouvrir le pipeline dans le navigateur ?') { Start-Process "$orgUrl/$devOpsProject/_build" }
        }
    }
}

#endregion

#region 6. Infrastructure deployment

if ($steps -contains $allSteps[5]) {
    Write-Step 'Déploiement de l''infrastructure'
    $deployScript = Join-Path $repoRoot 'infra' 'Deploy-BicepEnvironment.ps1'
    foreach ($env in $environments) {
        if ((Get-Content (Get-ParamFile $env) -Raw) -match "sqlAdminGroupObjectId = '00000000-0000-0000-0000-000000000000'") {
            Write-Host "  $env : l'object ID du groupe SQL est encore un placeholder, déploiement ignoré (étape 1)." -ForegroundColor DarkYellow
            continue
        }
        if (Confirm-Action "Lancer le what-if puis le déploiement de '$env' ?") {
            & $deployScript $env -Location $location
        }
    }
}

#endregion

Write-Step 'Terminé'
Write-Host "Pensez à commiter les .bicepparam modifiés dans infra/Environment."
