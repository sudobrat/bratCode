variable "location" {
  type        = string
  description = "The Azure region where all resources will be created"
  default     = "centralindia"
}

variable "prefix" {
  type        = string
  description = "A prefix used for all resources to ensure unique names"
  default     = "bratCode"
}

# The Resource Group acts as a folder containing all our Azure resources
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.prefix}-dev"
  location = var.location

  tags = {
    Environment = "Development"
    Project     = "bratCode"
    ManagedBy   = "Terraform"
  }
}
