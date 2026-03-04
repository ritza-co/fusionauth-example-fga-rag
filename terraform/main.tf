terraform {
  required_version = ">= 1.5.0"

  required_providers {
    fusionauth = {
      source  = "fusionauth/fusionauth"
      version = "~> 1.3"
    }
  }
}

provider "fusionauth" {
  host    = var.fusionauth_host
  api_key = local.fusionauth_api_key_effective
}

locals {
  project_env_file  = "${path.module}/../.env"
  project_env_lines = fileexists(local.project_env_file) ? split("\n", replace(file(local.project_env_file), "\r\n", "\n")) : []

  project_env_map = {
    for raw_line in local.project_env_lines :
    trimspace(split(raw_line, "=")[0]) => trimspace(join("=", slice(split(raw_line, "="), 1, length(split(raw_line, "=")))))
    if length(trimspace(raw_line)) > 0 && !startswith(trimspace(raw_line), "#") && length(split(raw_line, "=")) > 1
  }

  fusionauth_api_key_effective = length(trimspace(var.fusionauth_api_key)) > 0 ? var.fusionauth_api_key : lookup(local.project_env_map, "FUSIONAUTH_API_KEY", "")

  users_raw = fileexists(var.users_json_file) ? try(jsondecode(file(var.users_json_file)), []) : []

  users = [
    for user in local.users_raw : {
      user_id           = try(user.id, null)
      email             = user.email
      password          = try(user.password, var.user_password)
      first_name        = try(user.first_name, try(user.firstName, "User"))
      last_name         = try(user.last_name, try(user.lastName, ""))
      username          = try(user.username, null)
      skip_verification = try(user.skip_verification, true)
    }
    if try(user.email, null) != null
  ]

  users_by_email = { for user in local.users : user.email => user }
}

resource "terraform_data" "validate_api_key" {
  input = local.fusionauth_api_key_effective

  lifecycle {
    precondition {
      condition = (
        length(trimspace(local.fusionauth_api_key_effective)) > 0 &&
        local.fusionauth_api_key_effective != "replace-with-fusionauth-api-key"
      )
      error_message = "Set a real FusionAuth API key in terraform.tfvars (fusionauth_api_key) or in ../.env (FUSIONAUTH_API_KEY)."
    }
  }
}

resource "terraform_data" "validate_users_file" {
  input = var.users_json_file

  lifecycle {
    precondition {
      condition     = fileexists(var.users_json_file)
      error_message = "users_json_file '${var.users_json_file}' does not exist. Provide a valid path."
    }
  }
}

resource "fusionauth_application" "main" {
  name      = var.application_name
  tenant_id = var.tenant_id

  oauth_configuration {
    authorized_redirect_urls = var.authorized_redirect_urls
    logout_url               = var.logout_url
    enabled_grants           = ["authorization_code", "refresh_token"]
    generate_refresh_tokens  = true
    require_registration     = true
    scope_handling_policy    = "Compatibility"
    unknown_scope_policy     = "Allow"
  }

  dynamic "jwt_configuration" {
    for_each = length(trimspace(var.jwt_key_id)) > 0 ? [1] : []
    content {
      enabled         = true
      access_token_id = var.jwt_key_id
      id_token_key_id = var.jwt_key_id
    }
  }

  registration_configuration {
    enabled = true
    type    = "basic"
  }

  depends_on = [
    terraform_data.validate_api_key,
    terraform_data.validate_users_file,
  ]
}

resource "fusionauth_user" "main" {
  for_each = local.users_by_email

  tenant_id         = var.tenant_id
  first_name        = each.value.first_name
  last_name         = each.value.last_name
  email             = each.value.email
  username          = each.value.username
  password          = each.value.password
  skip_verification = each.value.skip_verification
}

resource "fusionauth_registration" "main" {
  for_each = fusionauth_user.main

  application_id = fusionauth_application.main.id
  user_id        = each.value.id
}
