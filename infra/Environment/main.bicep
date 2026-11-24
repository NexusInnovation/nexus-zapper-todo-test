// Resource-group-scoped orchestration: wires the modules copied from the bicep-nexus catalog.
// Everything project-specific (app settings, secret names, CORS, runtimes) lives here, never in a module.

@description('Environment code, for example dev or prod.')
param environment string

@description('Azure region for the resources.')
param location string

@description('When true, enables Key Vault purge protection.')
param enablePurgeProtection bool = false

@description('SKU of the App Service plan.')
param appServicePlanSku object

@description('Application name, used as the prefix of every resource name.')
param applicationName string

@description('Custom domain of the frontend, added to the backend CORS origins. Empty string when there is none.')
param customDomain string

@description('Extra backend app settings, as { name, value } objects.')
param backendAppSettings array

@description('Backend connection strings, as { name, connectionString, type } objects.')
param backendConnectionStrings array

@description('Extra frontend app settings, as { name, value } objects.')
param frontendAppSettings array

@description('Frontend connection strings, as { name, connectionString, type } objects.')
param frontendConnectionStrings array

@description('Object IDs of the users who manage the Key Vault secrets.')
param kvAdminIds array

@description('Public IPv4 addresses allowed through the Key Vault firewall.')
param kvIpWhitelist array

@description('SKU of the SQL database, for example { name: \'Basic\', tier: \'Basic\' }.')
param sqlDatabaseSku object

@description('Serverless SQL only: minutes of inactivity before the database pauses; -1 never pauses.')
param sqlAutoPauseDelay int

@description('Serverless SQL only: minimum vCores kept allocated, as a string.')
param sqlMinCapacity string

@description('When true, the SQL database replicas span availability zones.')
param sqlZoneRedundant bool

@description('Display name of the Entra ID group administering the SQL server, <applicationName>-<environment>-sql-admins.')
param sqlAdminGroupName string

@description('Object ID of the Entra ID group administering the SQL server.')
param sqlAdminGroupObjectId string

@description('Public IPv4 addresses allowed through the SQL server firewall.')
param sqlIpWhitelist array

// ---------------------------------------------------------------------------
// Common variables
// ---------------------------------------------------------------------------

var resourceNamePrefix = '${applicationName}-${environment}'

var backendCorsOrigin = toLower('https://${frontendAppServiceName}.azurewebsites.net')

var allowedOrigins = filter(union([backendCorsOrigin], [customDomain]), url => !empty(url))

var vnetName = '${resourceNamePrefix}-vnet'

var azureServicesSubnetName = '${resourceNamePrefix}-snet-azservice'
var appServicesSubnetName = '${resourceNamePrefix}-snet-appservice'
var functionsSubnetName = '${resourceNamePrefix}-snet-func'

var logAnalyticWorkspaceName = '${resourceNamePrefix}-log'
var applicationInsightsName = '${resourceNamePrefix}-appi'

var appServicePlanName = '${resourceNamePrefix}-asp'
var backendAppServiceName = '${resourceNamePrefix}-app-api'
var frontendAppServiceName = '${resourceNamePrefix}-app-web'

var keyVaultName = '${resourceNamePrefix}-kv'

var sqlServerName = '${resourceNamePrefix}-sql'
var sqlDatabaseName = '${resourceNamePrefix}-sqldb'

// Backend environment variables whose value is a Key Vault secret; none yet.
var secretEnvironmentVariableNames = []

// The Key Vault secret name is derived from the env var name so the two can never drift apart
var secretNames = map(secretEnvironmentVariableNames, environmentVariableName => {
  environmentVariableName: environmentVariableName
  keyvaultSecretName: replace(environmentVariableName, '__', '')
})

// The API's own CORS policy reads Cors:AllowedOrigins
var corsAppSettings = map(range(0, length(allowedOrigins)), i => {
  name: 'Cors__AllowedOrigins__${i}'
  value: allowedOrigins[i]
})

var isFreeSkuTier = startsWith(appServicePlanSku.name, 'F') || appServicePlanSku.name == 'D1'

// Deployment slots need Standard or higher: Basic (B*) has VNet integration but no slots
var supportsSlots = !isFreeSkuTier && !startsWith(appServicePlanSku.name, 'B')

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

module vnet 'Network/vnet.bicep' = {
  name: '${resourceNamePrefix}-vnet-module'
  params: {
    location: location
    vnetName: vnetName
    azureServicesSubnetName: azureServicesSubnetName
    appServicesSubnetName: appServicesSubnetName
    functionsSubnetName: functionsSubnetName
    // Needed by the SQL server's subnet rule. Safe here because no other SQL server is reached from this subnet.
    enableSqlServiceEndpoint: true
  }
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

module logAnalytics 'Monitoring/logAnalyticsWorkspace.bicep' = {
  name: 'logAnalytics-deployment'
  params: {
    location: location
    logAnalyticWorkspaceName: logAnalyticWorkspaceName
    retentionInDays: 90
    dailyQuotaGb: 1
  }
}

module applicationInsights 'Monitoring/applicationInsights.bicep' = {
  name: 'applicationInsights-deployment'
  params: {
    location: location
    applicationInsightsName: applicationInsightsName
    logAnalyticsId: logAnalytics.outputs.id
  }
}

// ---------------------------------------------------------------------------
// Workload
// ---------------------------------------------------------------------------

module appServicePlan 'Workload/appServicePlan.bicep' = {
  name: 'appServicePlan-deployment'
  params: {
    location: location
    sku: appServicePlanSku
    appServicePlanName: appServicePlanName
  }
}

module backendAppService 'Workload/appService.bicep' = {
  name: 'backendAppService-deployment'
  params: {
    location: location
    appServiceName: backendAppServiceName
    subnetId: isFreeSkuTier ? '' : vnet.outputs.appServiceSubnetId
    supportsSlots: supportsSlots
    serverFarmId: appServicePlan.outputs.serverFarmId
    appSettings: union(
      backendAppSettings,
      corsAppSettings,
      map(secretNames, secret => {
        name: secret.environmentVariableName
        value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/${secret.keyvaultSecretName})'
      }),
      [
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.outputs.ConnectionString
        }
        {
          name: 'XDT_MicrosoftApplicationInsights_Mode'
          value: 'recommended'
        }
        {
          name: 'XDT_MicrosoftApplicationInsights_PreemptSdk'
          value: 'disabled'
        }
      ]
    )
    linuxFxVersion: 'DOTNETCORE|10.0'
    // No password: SqlClient signs in with the app's user-assigned identity, found through AZURE_CLIENT_ID.
    // The API reads ConnectionStrings:DefaultConnection; one given in backendConnectionStrings wins.
    connectionStrings: contains(map(backendConnectionStrings, connection => connection.name), 'DefaultConnection')
      ? backendConnectionStrings
      : concat(backendConnectionStrings, [
          {
            name: 'DefaultConnection'
            connectionString: 'Server=tcp:${sqlServer.outputs.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};Authentication=Active Directory Default;Encrypt=True;'
            type: 'SQLAzure'
          }
        ])
    cors: {
      allowedOrigins: allowedOrigins
    }
  }
  dependsOn: [
    appServicePlan
    vnet
    sqlDatabase
  ]
}

module backendAppServiceMonitoring 'Workload/appService_monitoring.bicep' = {
  name: 'backendAppServiceMonitoring-deployment'
  params: {
    appServiceName: backendAppServiceName
    workspaceId: logAnalytics.outputs.id
  }
  dependsOn: [
    appServicePlan
    backendAppService
    logAnalytics
  ]
}

module frontendAppService 'Workload/appService.bicep' = {
  name: 'frontendAppService-deployment'
  params: {
    location: location
    appServiceName: frontendAppServiceName
    subnetId: isFreeSkuTier ? '' : vnet.outputs.appServiceSubnetId
    supportsSlots: supportsSlots
    serverFarmId: appServicePlan.outputs.serverFarmId
    linuxFxVersion: 'NODE|24-lts'
    appCommandLine: 'pm2 serve /home/site/wwwroot --no-daemon --spa --port 8080'
    appSettings: frontendAppSettings
    connectionStrings: frontendConnectionStrings
    healthCheckPath: '/health'
  }
  dependsOn: [
    appServicePlan
    vnet
  ]
}

module frontendAppServiceMonitoring 'Workload/appService_monitoring.bicep' = {
  name: 'frontendAppServiceMonitoring-deployment'
  params: {
    appServiceName: frontendAppServiceName
    workspaceId: logAnalytics.outputs.id
  }
  dependsOn: [
    appServicePlan
    frontendAppService
    logAnalytics
  ]
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

module keyVault 'Storage/KeyVault/keyVault.bicep' = {
  name: 'keyVault-deployment'
  params: {
    location: location
    name: keyVaultName
    enablePurgeProtection: enablePurgeProtection
    // Free-tier App Services have no VNet integration, so Key Vault must allow public access;
    // paid tiers are VNet-integrated and can enforce Deny.
    networkDefaultAction: isFreeSkuTier ? 'Allow' : 'Deny'
    subnetIds: [
      vnet.outputs.appServiceSubnetId
    ]
    ipWhitelist: kvIpWhitelist
  }
  dependsOn: [
    vnet
  ]
}

// Entra ID only: the backend identity's database user is created by the pipeline, see conventions.md#sql-database-access
module sqlServer 'Storage/Sql/sqlServer.bicep' = {
  name: 'sqlServer-deployment'
  params: {
    location: location
    sqlServerName: sqlServerName
    entraAdminGroupName: sqlAdminGroupName
    entraAdminGroupObjectId: sqlAdminGroupObjectId
    // Free-tier App Services have no VNet integration, so they reach SQL through the Azure services rule.
    subnetIds: isFreeSkuTier ? [] : [vnet.outputs.appServiceSubnetId]
    allowAzureServices: isFreeSkuTier
    ipWhitelist: sqlIpWhitelist
  }
  dependsOn: [
    vnet
  ]
}

module sqlDatabase 'Storage/Sql/sqlDatabase.bicep' = {
  name: 'sqlDatabase-deployment'
  params: {
    location: location
    sqlServerName: sqlServer.outputs.name
    databaseName: sqlDatabaseName
    sku: sqlDatabaseSku
    autoPauseDelay: sqlAutoPauseDelay
    minCapacity: sqlMinCapacity
    // TODO: confirm the client allows backups in the paired region; otherwise use 'Local' or 'Zone'.
    backupStorageRedundancy: isFreeSkuTier ? 'Local' : 'Geo'
    zoneRedundant: sqlZoneRedundant
  }
  dependsOn: [
    sqlServer
  ]
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

module keyVaultRbac 'Storage/KeyVault/keyVault_rbac.bicep' = {
  name: 'keyVaultRbac-deployment'
  params: {
    keyVaultName: keyVaultName
    principalIds: [
      backendAppService.outputs.principalId
    ]
    kvAdminIds: kvAdminIds
  }
  dependsOn: [
    backendAppService
    keyVault
  ]
}
