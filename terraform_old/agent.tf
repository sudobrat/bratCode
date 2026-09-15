resource "azurerm_container_app" "agent" {
  name                         = "agent-service"
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


  secret {
    name  = "mongodb-uri"
    value = "${var.mongodb_base_uri}/agent"
  }
  secret {
    name  = "groq-key"
    value = var.groq_api_key
  }
  secret {
    name  = "google-key"
    value = var.google_api_key
  }
  secret {
    name  = "tavily-key"
    value = var.tavily_api_key
  }
  secret {
    name  = "openrouter-key"
    value = var.openrouter_api_key
  }
  secret {
    name  = "qdrant-key"
    value = var.qdrant_api_key
  }
  # Inject the Azure Storage Key directly from the storage resource!
  secret {
    name  = "azure-storage-key"
    value = azurerm_storage_account.storage.primary_connection_string
  }

  template {
    min_replicas = 1
  max_replicas = 10
    container {
      name   = "agent"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
      cpu    = 0.5
      memory = "1Gi"
      # --- Standard Variables ---
      env {
        name  = "PORT"
        value = "8003"
      }
      env {
        name  = "QDRANT_URL"
        value = var.qdrant_url
      }
      env {
        name  = "AUTH_SERVICE"
        value = "https://${azurerm_container_app.auth.ingress[0].fqdn}"
      }

      env {
        name  = "CHAT_SERVICE"
        value = "https://${azurerm_container_app.chat.ingress[0].fqdn}"
      }

      env {
        name  = "REDIS_URL"
        value = "redis://redis-cache:6379"
      }
      env {
        name        = "MONGODB_URI"
        secret_name = "mongodb-uri"
      }
      env {
        name        = "GROQ_API_KEY"
        secret_name = "groq-key"
      }
      env {
        name        = "GOOGLE_API_KEY"
        secret_name = "google-key"
      }
      env {
        name        = "TAVILY_API_KEY"
        secret_name = "tavily-key"
      }
      env {
        name        = "OPENROUTER_API_KEY"
        secret_name = "openrouter-key"
      }
      env {
        name        = "QDRANT_API_KEY"
        secret_name = "qdrant-key"
      }
      env {
        name        = "AZURE_STORAGE_CONNECTION_STRING"
        secret_name = "azure-storage-key"
      }
    }
  }

  ingress {
    external_enabled = false
    target_port      = 8003
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
