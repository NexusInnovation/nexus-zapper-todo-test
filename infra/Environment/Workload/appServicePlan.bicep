@description('Azure region for the App Service plan.')
param location string

@description('Name of the App Service plan.')
param appServicePlanName string

@description('SKU object of the plan, for example { name: \'P0v3\' }. F1 and D1 are free tiers: no slots and no VNet integration. Other plans use Premium (P0 to P3) in the latest generation the region offers (v4, else v3). Basic, Standard, Premium v1 (P1, P2, P3 with no v suffix) and Premium v2 are not allowed.')
param sku object

resource appServicePlan 'Microsoft.Web/serverfarms@2025-03-01' = {
  name: appServicePlanName
  location: location
  sku: sku
  kind: 'Linux'
  properties: {
    reserved: true
  }
}

@description('Resource ID of the App Service plan.')
output serverFarmId string = appServicePlan.id
