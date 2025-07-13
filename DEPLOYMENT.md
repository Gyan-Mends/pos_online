# Deployment Guide for Vercel

## Prerequisites

1. **MongoDB Database**: You need a MongoDB database accessible from the internet (not localhost)
   - Recommended: MongoDB Atlas (free tier available)
   - Alternative: Railway, PlanetScale, or other cloud MongoDB providers

2. **Environment Variables**: Set up the following in your Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: Set to `production`

## Step-by-Step Deployment

### 1. Set up MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account and cluster
3. Get your connection string (it should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pos_v2?retryWrites=true&w=majority
   ```

### 2. Configure Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`

### 3. Deploy

1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy

## Troubleshooting

### Common Issues

1. **Build fails with dependency warnings**: 
   - This is normal for MongoDB optional dependencies
   - The `.npmrc` file should handle these

2. **Database connection timeouts**:
   - Ensure your MongoDB URI is correct
   - Make sure your database allows connections from Vercel's IP ranges
   - For MongoDB Atlas, ensure you've whitelisted all IPs (0.0.0.0/0)

3. **Serverless function timeout**:
   - Vercel has a 10-second timeout for serverless functions
   - Database operations should complete within this time

### Local Development

For local development, your `.env` file should contain:
```
MONGODB_URI=mongodb://localhost:27017/pos_v2
NODE_ENV=development
```

## File Structure

The deployment includes:
- `vercel.json`: Vercel configuration
- `.npmrc`: NPM configuration to handle MongoDB dependencies
- Updated `mongoose.server.ts`: Improved connection handling
- This deployment guide

## Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables are set correctly
3. Ensure MongoDB is accessible from external connections 