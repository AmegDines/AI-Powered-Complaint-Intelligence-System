variable "aws_region" {
  description = "AWS Region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "helpdeskadmin"
}

variable "db_password" {
  description = "RDS master password — override via TF_VAR_db_password env var"
  type        = string
  sensitive   = true
}

variable "ec2_public_key" {
  description = "Your SSH public key to access EC2 (run: ssh-keygen -t rsa and paste content here)"
  type        = string
}
