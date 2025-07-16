# Troubleshooting Guide

## Common Issues and Solutions

### "Load failed" Error

This error typically occurs when the frontend cannot connect to the backend API. Here are the most common causes and solutions:

#### 1. Incorrect API URL
**Problem**: The `NEXT_PUBLIC_API_URL` in your `.env.local` file is incorrect.

**Solution**: 
- Check your AWS ECS service URL
- Ensure the URL is accessible from your browser
- Test the API directly: `curl http://your-api-url:8000/api/v1/health`

#### 2. Backend Not Running
**Problem**: Your AWS ECS service is not running or accessible.

**Solution**:
- Check AWS ECS console to ensure your service is running
- Verify security groups allow inbound traffic on port 8000
- Check load balancer health checks

#### 3. Network/Firewall Issues
**Problem**: Network or firewall blocking the API requests.

**Solution**:
- Check if you can access the API URL directly in your browser
- Ensure your security groups allow HTTP traffic
- Verify your load balancer is properly configured

#### 4. Missing Environment Variables
**Problem**: `NEXT_PUBLIC_API_URL` is not set.

**Solution**:
- Create `.env.local` file in the frontend directory
- Copy from `.env.example` and update the API URL
- Restart your Next.js development server

### Testing Your Configuration

1. **Test API Health**:
   ```bash
   curl http://your-api-url:8000/api/v1/health
   ```

2. **Check Frontend Environment**:
   Open browser console and check if any errors are logged during file upload.

3. **Test File Upload**:
   Try uploading a small PDF file and check the network tab in browser developer tools.

### Debug Steps

1. Open browser developer tools (F12)
2. Go to Network tab
3. Try uploading a file
4. Check for failed requests and their error messages
5. Look at the Console tab for any JavaScript errors

### Contact Information

If you continue experiencing issues, please check:
- AWS ECS service logs
- Load balancer access logs
- Browser console errors
- Network connectivity between frontend and backend
