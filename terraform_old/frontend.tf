resource "azurerm_static_web_app" "frontend" {
  name                = "bratai-frontend"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "eastasia"
  sku_tier            = "Standard"
  sku_size            = "Standard"
}

# Print out the URL so you know where to visit your app!
output "frontend_url" {
  value = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "frontend_hostname" {
  value = azurerm_static_web_app.frontend.default_host_name
}

# Output the API key so GitHub actions can deploy to it!
output "static_web_app_api_token" {
  value     = azurerm_static_web_app.frontend.api_key
  sensitive = true
}
