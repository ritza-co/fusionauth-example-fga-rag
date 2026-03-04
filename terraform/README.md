# FusionAuth Terraform

This Terraform config targets an **existing tenant** and creates:
- 1 application under that tenant
- Users loaded from a JSON file
- 1 registration per user to the new application

## Prerequisites
- FusionAuth is running (the compose stack exposes it on `http://localhost:9011`)
- Terraform `>= 1.5`
- An existing FusionAuth tenant ID
- A FusionAuth API key with permission to manage applications, users, and registrations

## Usage

1. Copy the vars file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Set your API key. Either in `terraform.tfvars`:

```hcl
fusionauth_api_key = "<your-api-key>"
```

Or in the project `.env` (shared with Docker Compose) and leave `fusionauth_api_key` empty — Terraform will pick it up automatically:

```dotenv
FUSIONAUTH_API_KEY=<your-api-key>
```

3. Set the target tenant ID in `terraform.tfvars`:

```hcl
tenant_id = "<existing-tenant-uuid>"
```

4. Provide your users file (default: `./users.example.json`). Expected shape:

```json
[
  {
    "id": "2a1b3c4d-0000-0000-0000-000000000001",
    "email": "user1@example.com",
    "password": "ChangeMe123!",
    "first_name": "User",
    "last_name": "1",
    "username": "user1",
    "skip_verification": true
  }
]
```

- `id` — optional UUID; if omitted FusionAuth generates one
- `password` — optional; falls back to `var.user_password` if omitted

5. Run Terraform:

```bash
terraform init
terraform plan
terraform apply
```

## Variables

| Variable           | Required | Default                   | Description                                                    |
|--------------------|----------|---------------------------|----------------------------------------------------------------|
| `tenant_id`        | yes      | —                         | UUID of the existing tenant to create resources under          |
| `application_name` | no       | `kickstart-app`           | Name of the application to create                              |
| `users_json_file`  | no       | `./users.example.json`    | Path to the JSON file containing users                         |
| `user_password`    | no       | `ChangeMe123!`            | Fallback password for users without a `password` field in JSON |
| `fusionauth_host`  | no       | `http://localhost:9011`   | FusionAuth base URL                                            |
| `fusionauth_api_key` | no     | `""`                      | API key; falls back to `FUSIONAUTH_API_KEY` in `../.env`       |

## Troubleshooting

**401 Unauthorized**
- Ensure `fusionauth_host` points to the instance where the key was created.
- Ensure the key is valid and has permissions for applications, users, and registrations.
- Restart FusionAuth if you changed the API key in the environment, then re-run `terraform apply`.

**users_json_file not found**
- Terraform validates the file exists before applying. Ensure the path in `terraform.tfvars` is correct relative to the `terraform/` directory.
