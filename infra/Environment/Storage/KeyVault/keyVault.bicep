@description('Azure region for the Key Vault.')
param location string

@description('Name of the Key Vault. Must be globally unique, 3-24 characters.')
param name string

@description('When true, enables purge protection. It cannot be turned off afterwards.')
param enablePurgeProtection bool

@description('Firewall action for traffic that matches no subnet or IP rule. Use Allow when the callers have no VNet integration.')
@allowed([
  'Allow'
  'Deny'
])
param networkDefaultAction string = 'Deny'

@description('Resource IDs of subnets allowed to access the Key Vault. Each subnet must have the Microsoft.KeyVault service endpoint enabled.')
param subnetIds array

@description('Public IPv4 addresses or CIDR ranges allowed through the firewall.')
param ipWhitelist array = []

resource keyVault 'Microsoft.KeyVault/vaults@2026-05-15' = {
  name: name
  location: location
  properties: {
    sku: {
      name: 'standard'
      family: 'A'
    }
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    tenantId: subscription().tenantId
    enablePurgeProtection: enablePurgeProtection ? enablePurgeProtection : null // Yes, true or null instead of false is a weird behavior...
    enableRbacAuthorization: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: networkDefaultAction
      virtualNetworkRules: [
        for subnetId in subnetIds: {
          id: subnetId
          ignoreMissingVnetServiceEndpoint: false
        }
      ]
      ipRules: [
        for ip in ipWhitelist: {
          value: ip
        }
      ]
    }
  }
}

@description('Resource ID of the Key Vault.')
output id string = keyVault.id

@description('Name of the Key Vault.')
output name string = keyVault.name

@description('URI of the Key Vault, for example https://<name>.vault.azure.net/.')
output keyVaultUri string = keyVault.properties.vaultUri
