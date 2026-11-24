// One Zapper run: a container group with the runner and its sidecars (for example a database),
// deployed by Start-ZapperRun.ps1 and removed by Remove-ZapperRun.ps1. The group shares localhost,
// so the runner reaches a sidecar on 127.0.0.1. Docker is not available inside the group.
targetScope = 'resourceGroup'

@description('Name of the container group (one per run).')
param name string

param location string = resourceGroup().location

@description('Resource ID of the user-assigned identity that pulls the image.')
param identityId string

param registryLoginServer string

@description('Full image reference of the runner.')
param image string

param cpu int = 3
param memoryGb int = 12

@description('Non-secret environment variables of the runner.')
param environment object = {}

@description('Secret environment variables of the runner, resolved from Key Vault by Start-ZapperRun.ps1.')
@secure()
param secureEnvironment object = {}

@description('Sidecars: name, image, cpu, memoryGb, environment (object).')
param sidecars array = []

@description('Secret environment variables of each sidecar, keyed by sidecar name.')
@secure()
param sidecarSecureEnvironment object = {}

param storageAccountName string
param shareName string

param tags object = {}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

var runner = {
  name: 'runner'
  properties: {
    image: image
    resources: { requests: { cpu: cpu, memoryInGB: memoryGb } }
    environmentVariables: concat(
      map(items(environment), item => { name: item.key, value: string(item.value) }),
      map(items(secureEnvironment), item => { name: item.key, secureValue: string(item.value) })
    )
    volumeMounts: [{ name: 'output', mountPath: '/mnt/zapper' }]
  }
}

var sidecarContainers = [
  for sidecar in sidecars: {
    name: sidecar.name
    properties: {
      image: sidecar.image
      resources: { requests: { cpu: sidecar.cpu, memoryInGB: sidecar.memoryGb } }
      environmentVariables: concat(
        map(items(sidecar.?environment ?? {}), item => { name: item.key, value: string(item.value) }),
        map(items(sidecarSecureEnvironment[?sidecar.name] ?? {}), item => { name: item.key, secureValue: string(item.value) })
      )
    }
  }
]

resource group 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: name
  location: location
  tags: union(tags, { purpose: 'zapper-run' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identityId}': {} }
  }
  properties: {
    osType: 'Linux'
    restartPolicy: 'Never'
    sku: 'Standard'
    imageRegistryCredentials: [{ server: registryLoginServer, identity: identityId }]
    containers: concat([runner], sidecarContainers)
    volumes: [
      {
        name: 'output'
        azureFile: {
          shareName: shareName
          storageAccountName: storage.name
          storageAccountKey: storage.listKeys().keys[0].value
        }
      }
    ]
  }
}

output name string = group.name
