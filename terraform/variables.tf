variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "intelli-helpdesk"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_volume_size" {
  description = "EC2 root volume size in GB"
  type        = number
  default     = 20
}

variable "key_name" {
  description = "Existing AWS EC2 key pair"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed for SSH"
  type        = string
  default     = "0.0.0.0/0"
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "helpdesk"
}

variable "database_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "helpdesk_admin"
}

variable "database_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_storage_size" {
  description = "RDS storage size in GB"
  type        = number
  default     = 20
}