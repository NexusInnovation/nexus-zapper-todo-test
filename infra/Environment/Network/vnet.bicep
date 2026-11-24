@description('Azure region for the virtual network.')
param location string

@description('Name of the virtual network.')
param vnetName string

@description('Name of the subnet reserved for Azure services and private endpoints.')
param azureServicesSubnetName string

@description('Name of the subnet delegated to Microsoft.Web/serverfarms, used by App Service VNet integration.')
param appServicesSubnetName string

@description('Name of the subnet delegated to Microsoft.App/environments, used by Flex Consumption function apps.')
param functionsSubnetName string

@description('Address space of the virtual network, in CIDR notation.')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Address prefix of the Azure services subnet, in CIDR notation.')
param azureServicesSubnetPrefix string = '10.0.0.0/24'

@description('Address prefix of the App Service subnet, in CIDR notation.')
param appServicesSubnetPrefix string = '10.0.1.0/24'

@description('Address prefix of the function app subnet, in CIDR notation.')
param functionsSubnetPrefix string = '10.0.2.0/24'

@description('When true, adds the Microsoft.Sql service endpoint to the App Service subnet. On an existing VNet, every SQL server the apps reach through public IP rules then sees the subnet instead and needs a virtual network rule for it first.')
param enableSqlServiceEndpoint bool = false

var appServicesSubnetServiceEndpoints = concat(
  [
    {
      service: 'Microsoft.KeyVault'
    }
    {
      service: 'Microsoft.Storage'
    }
  ],
  enableSqlServiceEndpoint
    ? [
        {
          service: 'Microsoft.Sql'
        }
      ]
    : []
)

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2026-03-01' = {
  name: vnetName
  location: location
  tags: {
    type: 'network'
  }
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: azureServicesSubnetName
        properties: {
          addressPrefix: azureServicesSubnetPrefix
          privateEndpointNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: appServicesSubnetName
        properties: {
          addressPrefix: appServicesSubnetPrefix
          serviceEndpoints: appServicesSubnetServiceEndpoints
          delegations: [
            {
              name: '${appServicesSubnetName}-delegation'
              properties: {
                // Regular App Service / Elastic Premium plans use 'Microsoft.Web/serverfarms'.
                serviceName: 'Microsoft.Web/serverfarms'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
      {
        name: functionsSubnetName
        properties: {
          addressPrefix: functionsSubnetPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
          delegations: [
            {
              name: '${functionsSubnetName}-delegation'
              properties: {
                // Flex Consumption (FC1) function apps require delegation to Microsoft.App/environments.
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
    ]
  }

  resource azureServices 'subnets' existing = {
    name: azureServicesSubnetName
  }

  resource appServices 'subnets' existing = {
    name: appServicesSubnetName
  }

  resource functions 'subnets' existing = {
    name: functionsSubnetName
  }
}

@description('Resource ID of the virtual network.')
output vnetId string = virtualNetwork.id

@description('Resource ID of the Azure services subnet.')
output azureServiceSubnetId string = virtualNetwork::azureServices.id

@description('Resource ID of the App Service subnet.')
output appServiceSubnetId string = virtualNetwork::appServices.id

@description('Resource ID of the function app subnet.')
output functionsSubnetId string = virtualNetwork::functions.id
