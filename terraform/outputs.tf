output "application_id" {
  description = "ID of the application created under the tenant."
  value       = fusionauth_application.main.id
}

output "created_user_ids" {
  description = "IDs of users created from the JSON file."
  value       = values(fusionauth_user.main)[*].id
}

output "created_user_emails" {
  description = "Emails of users created from the JSON file."
  value       = values(fusionauth_user.main)[*].email
}
