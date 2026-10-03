output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.public.id
}

output "private_subnet_a_id" {
  description = "Private subnet A"
  value       = aws_subnet.private_a.id
}

output "private_subnet_b_id" {
  description = "Private subnet B"
  value       = aws_subnet.private_b.id
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "EC2 public IP"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS"
  value       = aws_instance.app.public_dns
}

output "rds_endpoint" {
  description = "PostgreSQL RDS endpoint"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "PostgreSQL RDS port"
  value       = aws_db_instance.postgres.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "s3_bucket_name" {
  description = "S3 bucket for ML artifacts"
  value       = aws_s3_bucket.ml.bucket
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.ml_processor.function_name
}

output "ssh_command" {
  description = "SSH command"
  value       = "ssh -i YOUR_DEMO_PEM_FILE ubuntu@${aws_instance.app.public_ip}"
}