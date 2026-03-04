variable "fusionauth_host" {
  description = "FusionAuth base URL."
  type        = string
  default     = "http://localhost:9011"
}

variable "fusionauth_api_key" {
  description = "FusionAuth API key. If empty, falls back to FUSIONAUTH_API_KEY from ../.env."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tenant_id" {
  description = "ID of the existing FusionAuth tenant to create the application and users under."
  type        = string

  validation {
    condition     = length(trimspace(var.tenant_id)) > 0
    error_message = "tenant_id must not be empty."
  }
}

variable "application_name" {
  description = "Name for the application created under the tenant."
  type        = string
  default     = "kickstart-app"
}

variable "users_json_file" {
  description = "Path to a JSON file containing users to create. Defaults to users.example.json."
  type        = string
  default     = "./users.example.json"
}

variable "user_password" {
  description = "Fallback password for users that do not specify one in the JSON file."
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"
}

variable "authorized_redirect_urls" {
  description = "List of authorized OAuth redirect URLs for the application (e.g. http://localhost:3000/api/auth/callback/fusionauth)."
  type        = list(string)
  default     = ["http://localhost:3000/api/auth/callback/fusionauth"]
}

variable "logout_url" {
  description = "URL to redirect to after logout."
  type        = string
  default     = "http://localhost:3000"
}

variable "jwt_key_id" {
  description = "ID of the FusionAuth asymmetric key used to sign access and ID tokens."
  type        = string
  default     = ""
}
