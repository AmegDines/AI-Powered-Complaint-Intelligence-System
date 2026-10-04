terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}

# ============================================================
# AWS PROVIDER
# ============================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================================
# DATA SOURCES
# ============================================================

data "aws_ami" "ubuntu" {
  most_recent = true

  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

data "aws_caller_identity" "current" {}

# ============================================================
# VPC
# ============================================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# ============================================================
# PUBLIC SUBNET
# EC2
# ============================================================

resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id

  cidr_block = "10.0.1.0/24"

  availability_zone = "${var.aws_region}a"

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# ============================================================
# PRIVATE SUBNET 1
# RDS
# ============================================================

resource "aws_subnet" "private_a" {
  vpc_id = aws_vpc.main.id

  cidr_block = "10.0.2.0/24"

  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-private-a"
  }
}

# ============================================================
# PRIVATE SUBNET 2
# RDS
# ============================================================

resource "aws_subnet" "private_b" {
  vpc_id = aws_vpc.main.id

  cidr_block = "10.0.3.0/24"

  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.project_name}-private-b"
  }
}

# ============================================================
# INTERNET GATEWAY
# ============================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ============================================================
# PUBLIC ROUTE TABLE
# ============================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-route"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ============================================================
# EC2 SECURITY GROUP
# ============================================================

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for Intelli Helpdesk EC2"
  vpc_id      = aws_vpc.main.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"

    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # HTTP for Traefik
  ingress {
    description = "HTTP for Traefik"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"

    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"

    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes NodePort
  ingress {
    description = "Kubernetes NodePort"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"

    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound
  egress {
    description = "Allow outbound traffic"

    from_port = 0
    to_port   = 0

    protocol = "-1"

    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# ============================================================
# RDS SECURITY GROUP
# ============================================================

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "PostgreSQL access from EC2"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL ONLY from EC2
  ingress {
    description = "PostgreSQL from EC2"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"

    security_groups = [
      aws_security_group.ec2.id
    ]
  }

  egress {
    description = "RDS outbound"

    from_port = 0
    to_port   = 0

    protocol = "-1"

    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# ============================================================
# IAM ROLE FOR EC2
# ============================================================

resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ============================================================
# EC2 → S3 POLICY
# ============================================================

resource "aws_iam_role_policy" "ec2_s3" {
  name = "${var.project_name}-s3-access"

  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = aws_s3_bucket.ml.arn
      },
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]

        Resource = "${aws_s3_bucket.ml.arn}/*"
      }
    ]
  })
}

# ============================================================
# EC2 INSTANCE PROFILE
# ============================================================

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-instance-profile"

  role = aws_iam_role.ec2.name
}

# ============================================================
# EC2 INSTANCE
# ============================================================

resource "aws_instance" "app" {
  ami = data.aws_ami.ubuntu.id

  instance_type = var.instance_type

  subnet_id = aws_subnet.public.id

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  key_name = var.key_name

  iam_instance_profile = aws_iam_instance_profile.ec2.name

  associate_public_ip_address = true

  # ==========================================================
  # EC2 BOOTSTRAP
  # ==========================================================

  user_data = <<-EOF
    #!/bin/bash

    set -e

    echo "Starting Intelli Helpdesk server setup..."

    apt-get update -y

    apt-get upgrade -y

    apt-get install -y \
      curl \
      wget \
      git \
      unzip \
      ca-certificates \
      apt-transport-https

    # ========================================================
    # DOCKER
    # ========================================================

    curl -fsSL https://get.docker.com | sh

    systemctl enable docker

    systemctl start docker

    usermod -aG docker ubuntu

    # ========================================================
    # K3S
    # ========================================================

    curl -sfL https://get.k3s.io | sh -

    systemctl enable k3s

    systemctl start k3s

    # ========================================================
    # KUBECTL CONFIG
    # ========================================================

    mkdir -p /home/ubuntu/.kube

    cp /etc/rancher/k3s/k3s.yaml \
      /home/ubuntu/.kube/config

    chown -R ubuntu:ubuntu /home/ubuntu/.kube

    chmod 600 /home/ubuntu/.kube/config

    # ========================================================
    # PROJECT DIRECTORIES
    # ========================================================

    mkdir -p /opt/intelli/models

    mkdir -p /opt/intelli/data

    mkdir -p /opt/intelli/backups

    chown -R ubuntu:ubuntu /opt/intelli

    echo "Intelli Helpdesk setup completed."

  EOF

  # ==========================================================
  # EBS STORAGE
  # ==========================================================

  root_block_device {
    volume_type = "gp3"

    volume_size = var.ec2_volume_size

    encrypted = true

    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-server"
  }
}

# ============================================================
# RDS SUBNET GROUP
# ============================================================

resource "aws_db_subnet_group" "postgres" {
  name = "${var.project_name}-postgres-subnet"

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]

  tags = {
    Name = "${var.project_name}-postgres-subnet"
  }
}

# ============================================================
# RDS POSTGRESQL
# ============================================================

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"

  engine = "postgres"

  engine_version = "16"

  instance_class = var.rds_instance_class

  allocated_storage = var.rds_storage_size

  storage_type = "gp3"

  storage_encrypted = true

  db_name = var.database_name

  username = var.database_username

  password = var.database_password

  port = 5432

  db_subnet_group_name = aws_db_subnet_group.postgres.name

  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  publicly_accessible = false

  multi_az = false

  backup_retention_period = 0

  auto_minor_version_upgrade = true

  deletion_protection = false

  skip_final_snapshot = true

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# ============================================================
# S3 BUCKET FOR ML ARTIFACTS
# ============================================================

resource "aws_s3_bucket" "ml" {
  bucket = "${var.project_name}-ml-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-ml-storage"
  }
}

# ============================================================
# S3 PUBLIC ACCESS BLOCK
# ============================================================

resource "aws_s3_bucket_public_access_block" "ml" {
  bucket = aws_s3_bucket.ml.id

  block_public_acls = true

  block_public_policy = true

  ignore_public_acls = true

  restrict_public_buckets = true
}

# ============================================================
# S3 ENCRYPTION
# ============================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "ml" {
  bucket = aws_s3_bucket.ml.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================
# S3 DIRECTORIES
# ============================================================

resource "aws_s3_object" "models" {
  bucket = aws_s3_bucket.ml.id

  key = "models/"
}

resource "aws_s3_object" "datasets" {
  bucket = aws_s3_bucket.ml.id

  key = "datasets/"
}

resource "aws_s3_object" "artifacts" {
  bucket = aws_s3_bucket.ml.id

  key = "artifacts/"
}

# ============================================================
# LAMBDA IAM ROLE
# ============================================================

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ============================================================
# LAMBDA LOGGING
# ============================================================

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role = aws_iam_role.lambda.name

  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ============================================================
# LAMBDA PACKAGE
# ============================================================

data "archive_file" "lambda" {
  type = "zip"

  output_path = "${path.module}/lambda_function.zip"

  source {
    filename = "lambda_function.py"

    content = <<-PYTHON
      import json

      def lambda_handler(event, context):

          print("Intelli Helpdesk ML processor started")

          return {
              "statusCode": 200,
              "body": json.dumps({
                  "message": "ML artifact processing completed"
              })
          }
    PYTHON
  }
}

# ============================================================
# LAMBDA FUNCTION
# ============================================================

resource "aws_lambda_function" "ml_processor" {
  function_name = "${var.project_name}-ml-processor"

  filename = data.archive_file.lambda.output_path

  source_code_hash = data.archive_file.lambda.output_base64sha256

  role = aws_iam_role.lambda.arn

  handler = "lambda_function.lambda_handler"

  runtime = "python3.12"

  timeout = 10

  memory_size = 128

  tags = {
    Name = "${var.project_name}-ml-processor"
  }
}

resource "aws_iam_role_policy" "ec2_ecr" {
  name = "intelli-helpdesk-ecr-access"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = [
          "arn:aws:ecr:ap-south-1:111169963700:repository/intelli-helpdesk-backend",
          "arn:aws:ecr:ap-south-1:111169963700:repository/intelli-helpdesk-frontend"
        ]
      }
    ]
  })
}
resource "aws_ecr_repository" "frontend" {
  name                 = "intelli-helpdesk-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "intelli-helpdesk-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}