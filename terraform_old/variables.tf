variable "mongodb_base_uri" {
  type        = string
  description = "The base MongoDB connection string (without the /auth or /chat at the end)"
  sensitive   = true
}

variable "razorpay_key_id" {
  type        = string
  description = "Razorpay Key ID"
}

variable "razorpay_key_secret" {
  type        = string
  description = "Razorpay Key Secret"
  sensitive   = true
}

# --- AI & External API Keys ---
variable "groq_api_key" {
  type      = string
  sensitive = true
}
variable "google_api_key" {
  type      = string
  sensitive = true
}
variable "tavily_api_key" {
  type      = string
  sensitive = true
}
variable "openrouter_api_key" {
  type      = string
  sensitive = true
}
# --- Qdrant Vector DB ---
variable "qdrant_url" {
  type = string
}
variable "qdrant_api_key" {
  type      = string
  sensitive = true
}
