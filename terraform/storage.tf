# Storage Account for our PVCs (Persistent Volume Claims)
resource "azurerm_storage_account" "storage" {
  name                     = "${var.prefix}storage${random_string.acr_suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  
  # Standard tier with LRS (Locally Redundant Storage) is the cheapest!
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  tags = azurerm_resource_group.rg.tags
}

# The actual File Share that will act as the "ide-pvc" hard drive
resource "azurerm_storage_share" "ide_share" {
  name                 = "ide-pvc-share"
  storage_account_name = azurerm_storage_account.storage.name
  quota                = 10 # 10 GB limit to keep costs low
}

# ---------------------------------------------------------
# AUTOMATION MAGIC: Create the Kubernetes Secret automatically!
# ---------------------------------------------------------
# AKS needs the Storage Account Key to mount the File Share.
# Instead of doing this manually, Terraform will push the secret straight into Kubernetes!
resource "kubernetes_secret" "azure_storage_secret" {
  metadata {
    name = "azure-secret"
  }

  data = {
    azurestorageaccountname = azurerm_storage_account.storage.name
    azurestorageaccountkey  = azurerm_storage_account.storage.primary_access_key
  }
}
