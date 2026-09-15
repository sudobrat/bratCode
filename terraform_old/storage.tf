# 1. Create the Storage Account
resource "azurerm_storage_account" "storage" {
  name                     = "brataistoragexyz123" # Must be globally unique, lowercase, no hyphens!
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS" # Locally Redundant Storage (Cheapest option)
}

# 2. Create the Container (Bucket) inside the Storage Account
resource "azurerm_storage_container" "files" {
  name                  = "bratai-files"
  storage_account_id    = azurerm_storage_account.storage.id
  container_access_type = "private" # Secure!
}

# 3. Tell Terraform to print the Connection String to your terminal!
output "azure_storage_connection_string" {
  value     = azurerm_storage_account.storage.primary_connection_string
  sensitive = true
}
