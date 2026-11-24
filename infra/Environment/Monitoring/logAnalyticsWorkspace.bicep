@description('Azure region for the Log Analytics workspace.')
param location string

@description('Name of the Log Analytics workspace.')
param logAnalyticWorkspaceName string

@description('Number of days the data is kept.')
param retentionInDays int = 90

@description('Daily ingestion cap in GB. 0 means no cap.')
param dailyQuotaGb int = 0

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2026-03-01' = {
  name: logAnalyticWorkspaceName
  location: location
  properties: union({
      retentionInDays: retentionInDays
    }, dailyQuotaGb > 0 ? {
      workspaceCapping: {
        dailyQuotaGb: dailyQuotaGb
      }
    } : {})
}

@description('Resource ID of the Log Analytics workspace.')
output id string = logAnalytics.id
