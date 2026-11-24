@description('Azure region for the Application Insights component.')
param location string

@description('Resource ID of the Log Analytics workspace that stores the telemetry.')
param logAnalyticsId string

@description('Name of the Application Insights component.')
param applicationInsightsName string

resource appInsightsComponents 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    DisableIpMasking: false
    DisableLocalAuth: false
    Flow_Type: 'Bluefield'
    ForceCustomerStorageForProfiler: false
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    Request_Source: 'rest'
    WorkspaceResourceId: logAnalyticsId
  }
}

@description('Instrumentation key of the component. Prefer ConnectionString for new code.')
output instrumentationKey string = appInsightsComponents.properties.InstrumentationKey

@description('Connection string to set as APPLICATIONINSIGHTS_CONNECTION_STRING on the apps that send telemetry.')
output ConnectionString string = appInsightsComponents.properties.ConnectionString

@description('Name of the Application Insights component.')
output name string = appInsightsComponents.name
