@description('Azure region for the App Service, its slots and its managed identity.')
param location string

@description('Name of the App Service. Its user-assigned identity is named <appServiceName>-uami.')
param appServiceName string

@description('Resource ID of the App Service plan that hosts the app.')
param serverFarmId string

@description('Resource ID of the subnet for VNet integration. Empty string disables VNet integration (free tiers).')
param subnetId string = ''

@description('App settings as { name, value } objects, merged over the module defaults.')
param appSettings array = []

@description('Connection strings as { name, connectionString, type } objects.')
param connectionStrings array = []

@description('When false, disables public network access to the app.')
param publicAccess bool = true

@description('CORS settings object, for example { allowedOrigins: [...] }. Empty object leaves CORS unset.')
param cors object = {}

@description('When true, creates the deployment slots and turns on Always On and the swap warm-up. Requires Standard tier or higher: Basic and free tiers have no slots.')
param supportsSlots bool = true

@description('Health check path probed by the platform, also used as the swap warm-up path by default.')
param healthCheckPath string = '/api/health'

@description('Path pinged to warm up a slot before a swap. Empty string reuses healthCheckPath.')
param warmupPingPath string = ''

@description('Linux runtime stack, for example DOTNETCORE|10.0 or NODE|24-lts.')
param linuxFxVersion string

@description('Startup command. Empty string uses the runtime default.')
param appCommandLine string = ''

@description('Names of the deployment slots to create when supportsSlots is true.')
param slotNames array = ['staging']

var alwaysOn = supportsSlots // Always On only needs Basic, but follows supportsSlots (Standard or higher)

var resolvedWarmupPingPath = empty(warmupPingPath) ? healthCheckPath : warmupPingPath

var defaultSettings = concat(
  [
    {
      name: 'WEBSITE_RUN_FROM_PACKAGE'
      value: '1'
    }
    {
      name: 'AZURE_CLIENT_ID'
      value: userAssignedIdentity.properties.clientId
    }
    // Cold start measures ~220s here, above the 230s platform default, which broke slot swaps.
    {
      name: 'WEBSITES_CONTAINER_START_TIME_LIMIT'
      value: '600'
    }
  ],
  supportsSlots
    ? [
        {
          name: 'WEBSITE_SWAP_WARMUP_PING_PATH'
          value: resolvedWarmupPingPath
        }
        {
          name: 'WEBSITE_SWAP_WARMUP_PING_STATUSES'
          value: '200'
        }
      ]
    : []
)

// Create a user-assigned managed identity to be used by the App Service and its slots so they share the same RBAC permissions
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${appServiceName}-uami'
  location: location
}

resource appService 'Microsoft.Web/sites@2025-03-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: serverFarmId
    virtualNetworkSubnetId: !empty(subnetId) ? subnetId : null
    keyVaultReferenceIdentity: userAssignedIdentity.id
    httpsOnly: true
    siteConfig: {
      healthCheckPath: supportsSlots ? healthCheckPath : null
      alwaysOn: alwaysOn
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      appSettings: union(defaultSettings, appSettings)
      connectionStrings: connectionStrings
      cors: cors
      publicNetworkAccess: publicAccess ? 'Enabled' : 'Disabled'
    }
  }
}

resource slots 'Microsoft.Web/sites/slots@2025-03-01' = [
  for slotName in slotNames: if (supportsSlots) {
    name: slotName
    parent: appService
    location: location
    identity: {
      type: 'UserAssigned'
      userAssignedIdentities: {
        '${userAssignedIdentity.id}': {}
      }
    }
    kind: 'app,linux'
    properties: {
      serverFarmId: serverFarmId
      virtualNetworkSubnetId: !empty(subnetId) ? subnetId : null
      keyVaultReferenceIdentity: userAssignedIdentity.id
      httpsOnly: true
      siteConfig: {
        healthCheckPath: healthCheckPath
        alwaysOn: true
        linuxFxVersion: linuxFxVersion
        appCommandLine: appCommandLine
        appSettings: union(defaultSettings, appSettings)
        connectionStrings: connectionStrings
        cors: cors
        publicNetworkAccess: publicAccess ? 'Enabled' : 'Disabled'
      }
    }
  }
]

@description('Principal ID of the user-assigned identity shared by the app and its slots, for role assignments.')
output principalId string = userAssignedIdentity.properties.principalId

@description('Resource ID of the App Service.')
output appServiceId string = appService.id
