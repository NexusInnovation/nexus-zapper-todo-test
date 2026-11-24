@description('Name of the Key Vault to scope the role assignments to.')
param keyVaultName string

@description('Principal IDs of the managed identities granted Key Vault Secrets User (read secrets).')
param principalIds array

@description('Object IDs of the users granted Key Vault Secrets Officer (manage secrets).')
param kvAdminIds array = []

// https://docs.microsoft.com/en-us/azure/key-vault/general/rbac-guide?tabs=azure-cli
var secretReaderRoleDefinitionResourceId = '4633458b-17de-408a-b874-0445c86b69e6'
var secretOfficerRoleDefinitionResourceId = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

resource keyVault 'Microsoft.KeyVault/vaults@2026-05-15' existing = {
  name: keyVaultName
}

resource servicePrincipalRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for principalId in principalIds: {
    scope: keyVault
    name: guid(keyVault.id, principalId, secretReaderRoleDefinitionResourceId)
    properties: {
      roleDefinitionId: subscriptionResourceId(
        'Microsoft.Authorization/roleDefinitions',
        secretReaderRoleDefinitionResourceId
      )
      principalId: principalId
      principalType: 'ServicePrincipal'
    }
  }
]

resource userSecretOfficerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for kvAdminsId in kvAdminIds: {
    scope: keyVault
    name: guid(keyVault.id, kvAdminsId, secretOfficerRoleDefinitionResourceId)
    properties: {
      roleDefinitionId: subscriptionResourceId(
        'Microsoft.Authorization/roleDefinitions',
        secretOfficerRoleDefinitionResourceId
      )
      principalId: kvAdminsId
      principalType: 'User'
    }
  }
]
