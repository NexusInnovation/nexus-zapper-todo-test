@description('Azure region for the SQL logical server.')
param location string

@description('Name of the SQL logical server. Must be globally unique, lowercase letters, digits and hyphens, at most 63 characters.')
@maxLength(63)
param sqlServerName string

@description('Display name of the Entra ID group set as the server administrator.')
param entraAdminGroupName string

@description('Object ID of the Entra ID group set as the server administrator. Its members create the database users of the app identities.')
param entraAdminGroupObjectId string

@description('Resource IDs of subnets allowed to reach the server. Each subnet must have the Microsoft.Sql service endpoint enabled (vnet.bicep enableSqlServiceEndpoint).')
param subnetIds array = []

@description('Public IPv4 addresses allowed through the firewall, for example developer or office IPs.')
param ipWhitelist array = []

@description('When true, adds the 0.0.0.0 firewall rule that lets any Azure service reach the server. Only for callers without VNet integration (free tier). Setting it back to false does not delete the rule.')
param allowAzureServices bool = false

resource sqlServer 'Microsoft.Sql/servers@2025-01-01' = {
  name: sqlServerName
  location: location
  properties: {
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    // Entra ID only: no SQL login and no password exist on the server.
    administrators: {
      administratorType: 'ActiveDirectory'
      azureADOnlyAuthentication: true
      login: entraAdminGroupName
      sid: entraAdminGroupObjectId
      principalType: 'Group'
      tenantId: subscription().tenantId
    }
  }
}

// Rules are named after their value, not their position: removing one entry leaves the others untouched,
// and the obsolete rule is easy to find. Deployments are incremental, so it must still be deleted by hand.
resource virtualNetworkRules 'Microsoft.Sql/servers/virtualNetworkRules@2025-01-01' = [
  for subnetId in subnetIds: {
    name: 'subnet-${last(split(subnetId, '/'))}'
    parent: sqlServer
    properties: {
      virtualNetworkSubnetId: subnetId
      ignoreMissingVnetServiceEndpoint: false
    }
  }
]

resource ipFirewallRules 'Microsoft.Sql/servers/firewallRules@2025-01-01' = [
  for ip in ipWhitelist: {
    name: 'ip-${replace(ip, '.', '-')}'
    parent: sqlServer
    properties: {
      startIpAddress: ip
      endIpAddress: ip
    }
  }
]

resource allowAzureServicesRule 'Microsoft.Sql/servers/firewallRules@2025-01-01' = if (allowAzureServices) {
  name: 'AllowAllWindowsAzureIps'
  parent: sqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('Resource ID of the SQL logical server.')
output id string = sqlServer.id

@description('Name of the SQL logical server.')
output name string = sqlServer.name

@description('Fully qualified domain name of the server, for example <name>.database.windows.net.')
output fullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
