# Frontend Configuration

## Environment Variables

To run the frontend, you need to configure the following environment variables:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```bash
   # Replace with your actual AWS ECS API URL
   NEXT_PUBLIC_API_URL=http://your-ecs-load-balancer-url:8000
   
   # Maximum file size in bytes (default: 10MB)
   NEXT_PUBLIC_MAX_FILE_SIZE=10485760
   ```

## Important Notes

- **NEXT_PUBLIC_API_URL**: This should point to your deployed backend API. Replace `your-ecs-load-balancer-url` with your actual AWS ECS load balancer URL.
- The API URL should NOT end with a trailing slash
- Make sure the backend API is accessible from your frontend deployment environment

## Local Development

For local development, if your backend is running locally:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

For production deployment on AWS or other cloud providers, use the appropriate load balancer or service URL:
```bash
NEXT_PUBLIC_API_URL=http://your-production-api-url:8000
```
