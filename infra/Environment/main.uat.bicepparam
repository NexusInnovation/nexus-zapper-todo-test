using './main.entrypoint.bicep'

param environment = 'uat'

// Paid tier: deployment slots, VNet integration, Key Vault firewall defaults to Deny
param appServicePlanSku = {
  name: 'P0v3'
}

param enablePurgeProtection = false

param backendAppSettings = [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Uat'
  }
]

param backendConnectionStrings = []

// TODO: object IDs of the people who manage the Key Vault secrets in uat.
param kvAdminIds = []

// TODO: public IP of the office or VPN, if Key Vault must be reached from outside Azure.
param kvIpWhitelist = []

// Serverless General Purpose: SSD storage and 0.5 to 1 vCore billed per second.
// S0-S2 are not used outside dev: less than one vCore and HDD storage.
param sqlDatabaseSku = {
  name: 'GP_S_Gen5_1'
  tier: 'GeneralPurpose'
}

// Never pause: resuming takes about a minute and the first requests fail meanwhile.
param sqlAutoPauseDelay = -1

// Lowest floor for 1 max vCore; raise it if the app is slow right after quiet periods.
param sqlMinCapacity = '0.5'

// The Entra ID group administering the SQL server. Resolve the object ID with: az ad group show --group zapper-todo-uat-sql-admins --query id -o tsv
param sqlAdminGroupName = 'zapper-todo-uat-sql-admins'
param sqlAdminGroupObjectId = '00000000-0000-0000-0000-000000000000' // TODO: object ID of the group; the deployment fails with this placeholder

param sqlZoneRedundant = false
