resource "azurerm_container_app" "gateway" {
  name                         = "gateway-service"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }


  template {
    min_replicas = 1
    max_replicas = 10
    container {
      name   = "gateway"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "PORT"
        value = "8000"
      }
      # Terraform passes the production custom domain to the backend for CORS!
      env {
        name  = "FRONTEND_URL"
        value = "https://bratai.bharatrajsingal.online"
      }


      # --- The Switchboard: Pointing to all internal services! ---
      env {
        name  = "AUTH_SERVICE"
        value = "https://${azurerm_container_app.auth.ingress[0].fqdn}"
      }
      env {
        name  = "CHAT_SERVICE"
        value = "https://${azurerm_container_app.chat.ingress[0].fqdn}"
      }
      env {
        name  = "AGENT_SERVICE"
        value = "https://${azurerm_container_app.agent.ingress[0].fqdn}"
      }
      env {
        name  = "BILLING_SERVICE"
        value = "https://${azurerm_container_app.billing.ingress[0].fqdn}"
      }
      env {
        name  = "REDIS_URL"
        value = "redis://redis-cache:6379"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
    ]
  }
}

output "gateway_url" {
  value = "https://${azurerm_container_app.gateway.ingress[0].fqdn}"
}
