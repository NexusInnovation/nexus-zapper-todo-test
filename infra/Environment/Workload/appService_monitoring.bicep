@description('Resource ID of the Log Analytics workspace that receives the App Service logs.')
param workspaceId string

@description('Name of the existing App Service whose logs are sent.')
param appServiceName string

resource appService 'Microsoft.Web/sites@2025-03-01' existing = {
  name: appServiceName
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'AppServiceDiagnosticSettings'
  scope: appService
  properties: {
    workspaceId: workspaceId
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
      {
        category: 'AppServiceAuditLogs'
        enabled: true
      }
      {
        category: 'AppServiceIPSecAuditLogs'
        enabled: true
      }
      {
        category: 'AppServicePlatformLogs'
        enabled: true
      }
    ]
    metrics: []
  }
}
