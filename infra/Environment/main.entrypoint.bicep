// Subscription-scoped entrypoint: creates the resource group, then deploys main.bicep into it.
// Deployed by Deploy-BicepEnvironment.ps1 with main.<environment>.bicepparam.

targetScope = 'subscription'

@description('Environment code. Keep this list in sync with the main.<environment>.bicepparam files.')
@allowed([
  'dev'
  'uat'
  'prod'
])
param environment string

@description('Azure region for the resource group and its resources.')
param location string = 'canadaeast'

@description('SKU of the App Service plan, for example { name: \'P0v3\' }. F1 is the free tier (no slots, no VNet integration); other environments use Premium (P0 to P3) in the latest generation the region offers (v3 in canadaeast). Basic, Standard, Premium v1 (P1, P2, P3 with no v suffix) and Premium v2 are not allowed.')
param appServicePlanSku object

@description('When true, enables Key Vault purge protection. It cannot be turned off afterwards.')
param enablePurgeProtection bool

@description('Extra backend app settings, as { name, value } objects.')
param backendAppSettings array = []

@description('Backend connection strings, as { name, connectionString, type } objects.')
param backendConnectionStrings array = []

@description('Extra frontend app settings, as { name, value } objects.')
param frontendAppSettings array = []

@description('Frontend connection strings, as { name, connectionString, type } objects.')
param frontendConnectionStrings array = []

@description('Object IDs of the users who manage the Key Vault secrets.')
param kvAdminIds array = []

@description('Public IPv4 addresses allowed through the Key Vault firewall.')
param kvIpWhitelist array = []

@description('Custom domain of the frontend, added to the backend CORS origins. Empty string when there is none.')
param customDomain string = ''

@description('SKU of the SQL database, for example { name: \'Basic\', tier: \'Basic\' } or { name: \'GP_S_Gen5_1\', tier: \'GeneralPurpose\' }. Not S0-S2 outside dev.')
param sqlDatabaseSku object

@description('Serverless SQL only: minutes of inactivity before the database pauses (at least 15); -1 never pauses.')
param sqlAutoPauseDelay int = -1

@description('Serverless SQL only: minimum vCores kept allocated, as a string, for example \'0.5\'.')
param sqlMinCapacity string = '0.5'

@description('When true, the SQL database replicas span availability zones. Needs a General Purpose or higher SKU and a region with zones.')
param sqlZoneRedundant bool = false

@description('Display name of the Entra ID group administering the SQL server, <applicationName>-<environment>-sql-admins. Its members, and the pipeline service connection, create the app database users.')
param sqlAdminGroupName string

@description('Object ID of the Entra ID group administering the SQL server.')
param sqlAdminGroupObjectId string

@description('Public IPv4 addresses allowed through the SQL server firewall.')
param sqlIpWhitelist array = []

var applicationName = 'zapper-todo'

var resourceGroupName = '${applicationName}-${environment}-rg'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
}

module main 'main.bicep' = {
  scope: resourceGroup
  name: 'mainDeployment'
  params: {
    applicationName: applicationName
    location: location
    environment: environment
    appServicePlanSku: appServicePlanSku
    backendAppSettings: backendAppSettings
    backendConnectionStrings: backendConnectionStrings
    frontendAppSettings: frontendAppSettings
    frontendConnectionStrings: frontendConnectionStrings
    enablePurgeProtection: enablePurgeProtection
    kvAdminIds: kvAdminIds
    kvIpWhitelist: kvIpWhitelist
    customDomain: customDomain
    sqlDatabaseSku: sqlDatabaseSku
    sqlAutoPauseDelay: sqlAutoPauseDelay
    sqlMinCapacity: sqlMinCapacity
    sqlZoneRedundant: sqlZoneRedundant
    sqlAdminGroupName: sqlAdminGroupName
    sqlAdminGroupObjectId: sqlAdminGroupObjectId
    sqlIpWhitelist: sqlIpWhitelist
  }
}
