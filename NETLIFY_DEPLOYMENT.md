# Netlify Deployment Guide

## Setting Up Environment Variables in Netlify

Your app is failing in production because the required environment variables are not set in Netlify. Here's how to fix it:

### 1. Access Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your Almaniac app
3. Go to **Site settings** → **Environment variables**

### 2. Add Required Environment Variables

Add these environment variables in Netlify:

#### NextAuth Configuration
```
NEXTAUTH_SECRET = [generate a secure 32-character secret]
NEXTAUTH_URL = https://your-app-name.netlify.app
```

#### API Keys
```
WEATHER_API_KEY = [your weather api key from weatherapi.com]
DEEPSEEK_API_KEY = [your deepseek api key from platform.deepseek.com]
```

#### Database Configuration
```
FREESQL_HOST = [your mysql database host]
FREESQL_DATABASE_NAME = [your database name]
FREESQL_DATABASE_USER = [your database username]
FREESQL_DATABASE_PASSWORD = [your database password]
FREESQL_DATABASE_PORT_NUMBER = 3306
```

### 3. Generate NextAuth Secret

Run this command locally to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Update NEXTAUTH_URL

Set `NEXTAUTH_URL` to your actual Netlify app URL:
- Format: `https://your-app-name.netlify.app`
- Replace `your-app-name` with your actual Netlify app name

### 5. Deploy After Setting Variables

After adding all environment variables:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the deployment to complete

### 6. Test the Deployment

1. Visit your Netlify app URL
2. You should see the login page
3. Try creating an account and logging in

## Troubleshooting

### If you still see "NO_SECRET" errors:

1. **Double-check variable names** - they must match exactly
2. **Redeploy** - environment variables only take effect after redeployment
3. **Check the build logs** - look for any other missing variables

### If database connection fails:

1. **Verify database credentials** - make sure they're correct
2. **Check database accessibility** - ensure your database allows connections from Netlify
3. **Test connection** - visit `/api/init-db` to test database connectivity

### If API keys don't work:

1. **Verify API keys** - make sure they're valid and active
2. **Check quotas** - ensure you haven't exceeded API limits
3. **Test locally first** - verify the keys work in your local environment

## Security Notes

- ✅ Never commit environment variables to Git
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly
- ✅ Use strong, unique passwords for database access

## Quick Setup Checklist

- [ ] Generate and set `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to your Netlify app URL
- [ ] Add `WEATHER_API_KEY`
- [ ] Add `DEEPSEEK_API_KEY`
- [ ] Add all database configuration variables
- [ ] Trigger a new deployment
- [ ] Test login functionality
- [ ] Verify database connectivity at `/api/init-db` 