// Zapper runner foundation, deployed once per resource group by Initialize-ZapperRunner.ps1:
// registry of the runner image, identity that pulls it, file share of the run outputs, and the
// Key Vault that holds the secrets of the runs. Project-agnostic: names derive from namePrefix.
targetScope = 'resourceGroup'

@description('Short lowercase prefix of the runner resources.')
@minLength(2)
@maxLength(12)
param namePrefix string

param location string = resourceGroup().location

@description('Object ID of the person who manages the runner secrets (Key Vault Secrets Officer).')
param vaultOfficerPrincipalId string = ''

param tags object = {}

var compactPrefix = toLower(replace(namePrefix, '-', ''))
var suffix = uniqueString(resourceGroup().id, namePrefix)
var allTags = union(tags, { purpose: 'zapper-runner' })

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: take('${compactPrefix}zapper${suffix}', 50)
  location: location
  tags: allTags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-zapper-runner'
  location: location
  tags: allTags
}

var acrPullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, identity.id, acrPullRoleId)
  scope: registry
  properties: {
    roleDefinitionId: acrPullRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: take('${compactPrefix}zap${suffix}', 24)
  location: location
  tags: allTags
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    // Azure Container Instances mounts Azure Files with the account key only.
    allowSharedKeyAccess: true
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource share 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: 'zapper-runs'
  properties: { shareQuota: 100 }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take('kv${compactPrefix}zap${suffix}', 24)
  location: location
  tags: allTags
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

var secretsOfficerRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')

resource vaultOfficer 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(vaultOfficerPrincipalId)) {
  name: guid(vault.id, vaultOfficerPrincipalId, secretsOfficerRoleId)
  scope: vault
  properties: {
    roleDefinitionId: secretsOfficerRoleId
    principalId: vaultOfficerPrincipalId
  }
}

output registryName string = registry.name
output registryLoginServer string = registry.properties.loginServer
output identityId string = identity.id
output storageAccountName string = storage.name
output shareName string = share.name
output keyVaultName string = vault.name
