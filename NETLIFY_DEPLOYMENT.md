# Netlify Deployment Guide

## 🚨 **URGENT: Fix Current Issues**

Your app is failing because:
1. **Database tables don't exist** - The `users` table is missing
2. **NEXTAUTH_URL is incorrect** - Causing authentication warnings

### **Step 1: Fix Environment Variables in Netlify**

1. Go to your Netlify dashboard
2. Select your Almaniac app
3. Go to **Site settings** → **Environment variables**
4. **Update/Add these variables**:

```bash
NEXTAUTH_SECRET = 1PZIqKsvaq5A8+K5YDRGkfxwEyOViEvrh8h8Sgzg6j4=
NEXTAUTH_URL = https://your-actual-netlify-app-url.netlify.app
WEATHER_API_KEY = [your weather api key]
DEEPSEEK_API_KEY = [your deepseek api key]
FREESQL_HOST = [your database host]
FREESQL_DATABASE_NAME = [your database name]
FREESQL_DATABASE_USER = [your database user]
FREESQL_DATABASE_PASSWORD = [your database password]
FREESQL_DATABASE_PORT_NUMBER = 3306
```

**⚠️ IMPORTANT**: Replace `https://your-actual-netlify-app-url.netlify.app` with your real Netlify app URL!

### **Step 2: Initialize Database Tables**

After the app deploys successfully:

1. **Visit your app's database initialization endpoint**:
   ```
   https://your-app-url.netlify.app/api/init-db
   ```
   
2. **Make a POST request** to create the tables:
   ```bash
   curl -X POST https://your-app-url.netlify.app/api/init-db
   ```

3. **Verify tables were created** - you should see a success response with all tables listed

### **Step 3: Test User Creation**

1. Visit your app: `https://your-app-url.netlify.app`
2. You should see the login page
3. Click "Sign Up" to create a new account
4. Try logging in with your new account

## Complete Environment Variables Setup

### Required Environment Variables

#### NextAuth Configuration
```
NEXTAUTH_SECRET = 1PZIqKsvaq5A8+K5YDRGkfxwEyOViEvrh8h8Sgzg6j4=
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

## Troubleshooting Current Issues

### ❌ "Table 'users' doesn't exist"
**Solution**: Run the database initialization:
```bash
curl -X POST https://your-app-url.netlify.app/api/init-db
```

### ❌ "NEXTAUTH_URL warning"
**Solution**: Set `NEXTAUTH_URL` to your exact Netlify app URL in environment variables

### ❌ "Failed to create user" (500 error)
**Solution**: 
1. Check database connection
2. Ensure all tables are created
3. Verify database credentials

### ❌ "401 Unauthorized" on signup
**Solution**: 
1. Ensure `NEXTAUTH_SECRET` is set
2. Restart deployment after setting environment variables

## Quick Fix Checklist

- [ ] Set `NEXTAUTH_URL` to your actual Netlify app URL
- [ ] Set `NEXTAUTH_SECRET` to: `1PZIqKsvaq5A8+K5YDRGkfxwEyOViEvrh8h8Sgzg6j4=`
- [ ] Add all database environment variables
- [ ] Add API keys for Weather and DeepSeek
- [ ] Trigger new deployment
- [ ] Run database initialization: `curl -X POST https://your-app-url.netlify.app/api/init-db`
- [ ] Test user signup and login

## Database Initialization Details

The `/api/init-db` endpoint will create these tables:
1. `users` - User accounts and authentication
2. `plants` - Plant tracking data
3. `weather_records` - Weather data storage
4. `activity_logs` - User activity tracking
5. `ai_recommendations` - AI-generated recommendations
6. `locations` - Location management

## Security Notes

- ✅ Never commit environment variables to Git
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly
- ✅ Use strong, unique passwords for database access

## Next Steps After Fix

1. **Test the complete flow**:
   - Visit app → See login page
   - Create account → Should succeed
   - Login → Should access dashboard
   - Add plants → Should save to database
   - Check weather → Should display current conditions

2. **Verify all features work**:
   - Plant management
   - Weather data
   - AI recommendations
   - Activity logging 