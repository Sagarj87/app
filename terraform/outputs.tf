output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}
output "ecs_service_name" {
  value = aws_ecs_service.app.name
}
output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
output "service_public_ip_assigned" {
  value = aws_ecs_service.app.network_configuration[0].assign_public_ip
  description = "Whether the ECS service assigns a public IP to tasks (true/false)."
}
output "alb_dns_name" {
  value = aws_lb.app_alb.dns_name
  description = "The DNS name of the Application Load Balancer. Use this to access your app."
}
