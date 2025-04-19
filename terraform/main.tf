provider "aws" {
  region = "us-east-1" # Change to your preferred region
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"
  name = "ecs-vpc"
  cidr = "10.0.0.0/16"
  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_nat_gateway = false
  single_nat_gateway = true
}

resource "aws_ecr_repository" "app" {
  name = "springboot-react-fullstack"
}

resource "aws_ecs_cluster" "main" {
  name = "springboot-react-cluster"
}

resource "aws_security_group" "ecs_service" {
  name        = "ecs-service-sg"
  description = "Allow HTTP"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "app_alb" {
  name               = "springboot-react-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "app_tg" {
  name     = "springboot-react-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "ip"
  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "springboot-react-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  container_definitions    = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
      environment = [
        {
          name  = "S3_BUCKET_NAME"
          value = module.s3_bucket.s3_bucket_id
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]
      mountPoints = [
        {
          sourceVolume  = "app-logs"
          containerPath = "/app/logs"
        }
      ]
    },
    {
      name      = "fluent-bit"
      image     = "amazon/aws-for-fluent-bit:latest"
      essential = false
      firelensConfiguration = {
        type = "fluentbit"
      }
      logConfiguration = {
        logDriver = "awsfirelens"
      }
      mountPoints = [
        {
          sourceVolume  = "app-logs"
          containerPath = "/app/logs"
        },
        {
          sourceVolume  = "fluentbit-logs"
          containerPath = "/fluent-bit/logs"
        }
      ]
      environment = [
        {
          name  = "FLUENT_BIT_CONFIG"
          value = aws_ssm_parameter.fluentbit_config.value
        }
      ]
    }
  ])
  volume {
    name = "app-logs"
  }
  volume {
    name = "fluentbit-logs"
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_s3_policy" {
  name = "ecsTaskS3Policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          module.s3_bucket.s3_bucket_arn,
          "${module.s3_bucket.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_ecs_service" "app" {
  name            = "springboot-react-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = "app"
    container_port   = 8080
  }

  network_configuration {
    subnets          = module.vpc.public_subnets
    security_groups  = [aws_security_group.ecs_service.id]
    assign_public_ip = true
  }
  depends_on = [aws_lb_listener.app_listener]
}

resource "null_resource" "docker_push" {
  provisioner "local-exec" {
    command = <<EOT
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
      docker build -t ${aws_ecr_repository.app.repository_url}:latest ..
      docker push ${aws_ecr_repository.app.repository_url}:latest
    EOT
  }
  triggers = {
    always_run = timestamp()
  }
  depends_on = [aws_ecr_repository.app]
}

module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "4.1.2"
  bucket  = var.s3_bucket_name
  # Remove ACL configuration to avoid error: The bucket does not allow ACLs
  # acl     = "private"
  force_destroy = true
  tags = {
    Name        = var.s3_bucket_name
    Environment = "dev"
  }
}

variable "s3_bucket_name" {
  description = "The name of the S3 bucket for file uploads."
  type        = string
  default     = "springboot-jwt-auth-uploads"
}

resource "aws_cloudwatch_log_group" "ecs_app" {
  name              = "/ecs/${aws_ecs_cluster.main.name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "fluentbit" {
  name              = "/ecs/fluentbit"
  retention_in_days = 14
}

resource "aws_ssm_parameter" "fluentbit_config" {
  name  = "/ecs/fluent-bit.conf"
  type  = "String"
  value = <<EOF
[SERVICE]
    Flush        1
    Log_Level    info
    Daemon       off
    Parsers_File parsers.conf
    Log_File     /fluent-bit/logs/fluentbit.log

[INPUT]
    Name   tail
    Path   /app/logs/app.log
    Tag    app.log
    DB     /tmp/flb_applog.db
    Mem_Buf_Limit 5MB
    Skip_Long_Lines On

[OUTPUT]
    Name   cloudwatch_logs
    Match  *
    region ${var.aws_region}
    log_group_name ${aws_cloudwatch_log_group.ecs_app.name}
    log_stream_prefix app-

[OUTPUT]
    Name   file
    Match  *
    Path   /fluent-bit/logs/
    Format json_lines
    File   fluentbit.log
EOF
}
