resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${var.prefix}-aks"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "${var.prefix}-aks"

  default_node_pool {
    name       = "default"
    
    # Cost-saving measure: We use a Burst series VM (2 vCPU, 4GB RAM) which is very cheap.
    # When you apply/destroy frequently, this keeps your idle bill extremely low.
    vm_size    = "Standard_B2s_v2" 
    
    # Keep costs minimal for testing
    node_count = 1
  }

  # Azure enables this by default now, so we must explicitly tell Terraform 
  # to expect it, otherwise Terraform will try to disable it and fail!
  oidc_issuer_enabled = true
  workload_identity_enabled = true

  identity {
    type = "SystemAssigned"
  }

  tags = azurerm_resource_group.rg.tags
}

# ---------------------------------------------------------
# SECURITY ROLE: Allow AKS to pull images from our ACR
# ---------------------------------------------------------
resource "azurerm_role_assignment" "aks_to_acr" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}
