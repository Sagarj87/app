# Spring Boot + React JWT Auth Full Stack App

This project is a full stack application with a Spring Boot backend and a React (Vite + Tailwind CSS) frontend, featuring JWT-based authentication and authorization, and is ready for cloud deployment with Docker and Terraform on AWS ECS.

## Features
- User registration and login (JWT-based)
- Role-based authorization (default: ROLE_USER)
- Protected REST API endpoint
- React frontend for registration, login, and accessing protected resources
- Modern UI with Tailwind CSS
- Dockerized for easy deployment
- Terraform scripts for AWS ECS Fargate + ALB deployment

## Getting Started

### Prerequisites
- Java 21
- Node.js & npm
- Maven
- Docker
- AWS CLI (for deployment)
- Terraform

### Backend Setup (Spring Boot)
1. In the project root, run:
   ```sh
   mvn spring-boot:run
   ```
2. The backend will start on `http://localhost:8080`.

### Frontend Setup (React + Vite + Tailwind)
1. In the `frontend` directory, install dependencies:
   ```sh
   npm install
   ```
2. Start the React dev server:
   ```sh
   npm run dev
   ```
3. Open your browser at the address shown (usually `http://localhost:5173`).

### Usage
- Register a new user.
- Log in with your credentials.
- Click "Fetch Protected Resource" to access the protected endpoint.

### Docker Deployment (Local)
1. Build the Docker image:
   ```sh
   docker build -t springboot-react-fullstack .
   ```
2. Run the container:
   ```sh
   docker run -p 8080:8080 springboot-react-fullstack
   ```
3. Access the app at [http://localhost:8080](http://localhost:8080)

### AWS ECS Deployment with Terraform
1. Edit `terraform/variables.tf` if you want to change the AWS region.
2. In the `terraform` directory, run:
   ```sh
   terraform init
   terraform apply
   ```
3. Terraform will output the ECR repo URL and ALB DNS name.
4. The Docker image will be built and pushed to ECR automatically.
5. Access your app at the ALB DNS name output by Terraform.

### Project Structure
- `src/main/java/com/example/springbootjwtauth/` — Spring Boot backend (entities, controllers, security, etc.)
- `frontend/` — React frontend (components, context, Tailwind CSS, etc.)
- `Dockerfile` — Multi-stage build for backend and frontend
- `terraform/` — Infrastructure as code for AWS ECS, ECR, VPC, ALB

## AWS S3 Integration (Environment Variables)

To enable file uploads to S3, the following environment variables must be set for your Spring Boot app (automatically injected in ECS via Terraform):

- `S3_BUCKET_NAME`: The name of the S3 bucket for uploads (created by Terraform)
- `AWS_REGION`: The AWS region where the S3 bucket is located (e.g., `us-east-1`)

These are referenced in `application.yml`:

```yaml
aws:
  s3:
    bucket: ${S3_BUCKET_NAME:springboot-jwt-auth-uploads}
  region: ${AWS_REGION:us-east-1}
```

When running locally, you can set these variables in your shell or with a `.env` file and a tool like [dotenv](https://github.com/cdimascio/dotenv-java) or by exporting them before running your app:

```sh
export S3_BUCKET_NAME=your-bucket-name
export AWS_REGION=us-east-1
mvn spring-boot:run
```

When deployed to AWS ECS, these variables are automatically injected by Terraform.

## Workspace-specific Coding Instructions

This project is a Spring Boot backend with JWT authentication and authorization. When generating code, please:
- Generate code for User, Role entities
- Include JWT utilities
- Provide authentication/authorization endpoints
- Implement secure REST APIs as needed

These instructions are enforced for all code generation in this workspace.

---

<details>
<summary>Workspace Context</summary>

- Current OS: macOS
- Workspace root: /Users/sagarms/Documents/code/App
- Main backend: Spring Boot (Java)
- Frontend: React (Vite, Tailwind CSS)
- Infrastructure: Docker, Terraform (ECS, S3, ALB)

</details>

---

For any issues or questions, please open an issue or contact the maintainer.
