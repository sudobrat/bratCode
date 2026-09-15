# ACR names must be globally unique and contain only lowercase letters and numbers
resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_container_registry" "acr" {
  name                = "${var.prefix}acr${random_string.acr_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  
  # Basic is the cheapest tier! Perfect for keeping costs low.
  sku                 = "Basic"
  
  # Enabling admin gives you a username/password so you can push images from your local laptop
  admin_enabled       = true

  tags = azurerm_resource_group.rg.tags
}
