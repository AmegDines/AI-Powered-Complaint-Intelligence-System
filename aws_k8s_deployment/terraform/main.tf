##############################################
# Terraform — AWS Free Tier Helpdesk Deployment
# Strategy: 1 t2.micro EC2 + K3s + RDS db.t3.micro + S3 for ML model
##############################################

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

#----------------------------------------------
# DATA SOURCES
#----------------------------------------------
data "aws_availability_zones" "available" {}

#----------------------------------------------
# VPC — Custom VPC keeps traffic internal
# Free tier includes VPC usage
#----------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "helpdesk-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "helpdesk-igw" }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "helpdesk-public-1" }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags                    = { Name = "helpdesk-public-2" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "helpdesk-public-rt" }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

#----------------------------------------------
# SECURITY GROUPS
#----------------------------------------------
# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "helpdesk-ec2-sg"
  description = "Allow web, SSH, monitoring and Kubernetes ports"
  vpc_id      = aws_vpc.main.id

  # HTTP
  ingress { from_port = 80,   to_port = 80,   protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # HTTPS
  ingress { from_port = 443,  to_port = 443,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # SSH
  ingress { from_port = 22,   to_port = 22,   protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # K3s API
  ingress { from_port = 6443, to_port = 6443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # Backend API (FastAPI)
  ingress { from_port = 8000, to_port = 8000, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # Grafana Web UI
  ingress { from_port = 3000, to_port = 3000, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # Prometheus
  ingress { from_port = 9090, to_port = 9090, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  # K8s NodePort range
  ingress { from_port = 30000, to_port = 32767, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }

  egress { from_port = 0, to_port = 0, protocol = "-1", cidr_blocks = ["0.0.0.0/0"] }
  tags = { Name = "helpdesk-ec2-sg" }
}

# RDS Security Group — only EC2 can talk to DB
resource "aws_security_group" "rds_sg" {
  name        = "helpdesk-rds-sg"
  description = "Allow Postgres access from EC2 only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }
  egress { from_port = 0, to_port = 0, protocol = "-1", cidr_blocks = ["0.0.0.0/0"] }
  tags = { Name = "helpdesk-rds-sg" }
}

#----------------------------------------------
# S3 BUCKET — Store ML model artifact (.joblib)
# Free tier: 5GB storage free
#----------------------------------------------
resource "aws_s3_bucket" "ml_models" {
  bucket = "helpdesk-ml-models-${random_id.suffix.hex}"
  tags   = { Name = "Helpdesk ML Models", Environment = "production" }
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "ml_models" {
  bucket = aws_s3_bucket.ml_models.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "ml_models" {
  bucket                  = aws_s3_bucket.ml_models.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#----------------------------------------------
# IAM Role — Let EC2 access S3 for ML model
#----------------------------------------------
resource "aws_iam_role" "ec2_s3_role" {
  name = "helpdesk-ec2-s3-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_s3_policy" {
  name = "helpdesk-s3-access"
  role = aws_iam_role.ec2_s3_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.ml_models.arn, "${aws_s3_bucket.ml_models.arn}/*"]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "helpdesk-ec2-profile"
  role = aws_iam_role.ec2_s3_role.name
}

#----------------------------------------------
# RDS PostgreSQL — Free Tier db.t3.micro
# Replaces local Docker volume DB
# 20GB Free Tier storage
#----------------------------------------------
resource "aws_db_subnet_group" "main" {
  name       = "helpdesk-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  tags       = { Name = "helpdesk-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "helpdesk-rds"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"   # FREE TIER eligible
  allocated_storage      = 20              # FREE TIER: 20GB max
  storage_type           = "gp2"

  db_name                = "helpdesk"
  username               = var.db_username
  password               = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible    = false           # Private; only EC2 can reach it
  skip_final_snapshot    = true
  deletion_protection    = false

  backup_retention_period = 7              # 7-day automated backups (free)

  tags = { Name = "helpdesk-rds" }
}

#----------------------------------------------
# EC2 INSTANCE — t2.micro (FREE TIER)
# Runs K3s (Lightweight Kubernetes)
# 30GB EBS (max free tier EBS)
#----------------------------------------------
resource "aws_key_pair" "deployer" {
  key_name   = "helpdesk-deployer-key"
  public_key = var.ec2_public_key
}

resource "aws_instance" "k3s_server" {
  ami                    = "ami-0c7217cdde317cfec"   # Ubuntu 22.04 LTS us-east-1
  instance_type          = "t2.micro"                # FREE TIER: 750 hrs/month
  key_name               = aws_key_pair.deployer.key_name
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 30          # FREE TIER: max 30GB EBS
    volume_type = "gp3"       # gp3 is faster and same price as gp2
    encrypted   = true
  }

  user_data = templatefile("${path.module}/userdata.sh", {
    db_url         = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/helpdesk"
    s3_bucket_name = aws_s3_bucket.ml_models.bucket
  })

  tags = { Name = "helpdesk-k3s-server" }

  # Wait for RDS to be ready before EC2 boots
  depends_on = [aws_db_instance.postgres]
}

#----------------------------------------------
# OUTPUTS
#----------------------------------------------
output "ec2_public_ip" {
  description = "EC2 Public IP — SSH here and access the app"
  value       = aws_instance.k3s_server.public_ip
}

output "rds_endpoint" {
  description = "RDS DB endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket where ML model is stored"
  value       = aws_s3_bucket.ml_models.bucket
}
