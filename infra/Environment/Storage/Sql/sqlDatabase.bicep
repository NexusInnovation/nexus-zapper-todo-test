@description('Azure region of the database. Must be the region of its server.')
param location string

@description('Name of the existing SQL logical server hosting the database.')
param sqlServerName string

@description('Name of the database.')
param databaseName string

@description('SKU of the database, for example { name: \'Basic\', tier: \'Basic\' } (dev) or { name: \'GP_S_Gen5_1\', tier: \'GeneralPurpose\' } (serverless). Avoid S0-S2: less than one vCore and HDD storage.')
param sku object

@description('Serverless only: minutes of inactivity before the database pauses, at least 15. -1 never pauses. Ignored for other SKUs.')
param autoPauseDelay int = -1

@description('Serverless only: minimum vCores kept allocated, as a string because Bicep has no decimal type (for example \'0.5\'). Ignored for other SKUs.')
param minCapacity string = '0.5'

@description('Storage redundancy of the backups. Geo and GeoZone copy them to the paired region (canadaeast <-> canadacentral), so check the client\'s data residency rules first; Local is the cheapest.')
@allowed([
  'Local'
  'Zone'
  'Geo'
  'GeoZone'
])
param backupStorageRedundancy string = 'Geo'

@description('When true, spreads the database replicas across availability zones. Needs a General Purpose, Business Critical or Premium SKU and a region with zones; costs more.')
param zoneRedundant bool = false

// Serverless SKUs are named GP_S_* (General Purpose) or HS_S_* (Hyperscale).
var isServerless = contains(sku.name, '_S_')

// Never pausing by default: resuming a paused database takes about a minute and fails the first requests.
// Dev can opt in to a pause to save cost. minCapacity is the floor billed even when idle.
var serverlessProperties = isServerless
  ? {
      autoPauseDelay: autoPauseDelay
      minCapacity: json(minCapacity)
    }
  : {}

resource sqlServer 'Microsoft.Sql/servers@2025-01-01' existing = {
  name: sqlServerName
}

resource database 'Microsoft.Sql/servers/databases@2025-01-01' = {
  name: databaseName
  parent: sqlServer
  location: location
  sku: sku
  properties: union(
    {
      requestedBackupStorageRedundancy: backupStorageRedundancy
      zoneRedundant: zoneRedundant
    },
    serverlessProperties
  )
}

@description('Resource ID of the database.')
output id string = database.id

@description('Name of the database.')
output name string = database.name
