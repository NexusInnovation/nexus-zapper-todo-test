using './main.entrypoint.bicep'

param environment = 'dev'

// Free tier: no slots, no VNet integration, Key Vault firewall defaults to Allow
param appServicePlanSku = {
  name: 'F1'
}

param enablePurgeProtection = false

param backendAppSettings = [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Dev'
  }
]

param backendConnectionStrings = []

param kvAdminIds = [
  '53f80690-8890-492c-a5be-afd62d27a320' // Eric De Carufel
]

// TODO: public IP of the office or VPN, if Key Vault must be reached from outside Azure.
param kvIpWhitelist = []

// DTU Basic (about 5 $/month) is enough for dev. sqlAutoPauseDelay and sqlMinCapacity only apply to serverless SKUs.
param sqlDatabaseSku = {
  name: 'Basic'
  tier: 'Basic'
}

// The Entra ID group administering the SQL server. Resolve the object ID with: az ad group show --group zapper-todo-dev-sql-admins --query id -o tsv
param sqlAdminGroupName = 'zapper-todo-dev-sql-admins'
param sqlAdminGroupObjectId = '4ed8a5d5-0734-4814-93a8-1b6184fca63d'

// TODO: public IP of the office or VPN, for developers who query the database from their machine.
param sqlIpWhitelist = []
