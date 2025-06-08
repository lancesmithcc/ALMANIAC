# Environment Setup Guide

This application requires several environment variables to function properly. Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

### NextAuth Configuration
```bash
# Generate a random secret for NextAuth (required for production)
# You can generate one using: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key-here

# The URL of your application (adjust for your deployment)
NEXTAUTH_URL=http://localhost:3000
```

### Weather API
```bash
# Get your free API key from https://www.weatherapi.com/
WEATHER_API_KEY=your-weather-api-key-here
```

### DeepSeek AI
```bash
# Get your API key from https://platform.deepseek.com/
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

### Database Configuration (FreeSQL/MySQL)
```bash
# Your MySQL database connection details
FREESQL_HOST=your-database-host
FREESQL_DATABASE_NAME=your-database-name
FREESQL_DATABASE_USER=your-database-user
FREESQL_DATABASE_PASSWORD=your-database-password
FREESQL_DATABASE_PORT_NUMBER=3306
```

## Example .env.local File

Create a file named `.env.local` in the root directory:

```bash
# NextAuth
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
NEXTAUTH_URL=http://localhost:3000

# Weather API
WEATHER_API_KEY=your_weather_api_key_here

# DeepSeek AI
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Database
FREESQL_HOST=your-mysql-host.com
FREESQL_DATABASE_NAME=almaniac_db
FREESQL_DATABASE_USER=your_username
FREESQL_DATABASE_PASSWORD=your_password
FREESQL_DATABASE_PORT_NUMBER=3306
```

## Getting API Keys

### Weather API
1. Go to https://www.weatherapi.com/
2. Sign up for a free account
3. Get your API key from the dashboard

### DeepSeek AI
1. Go to https://platform.deepseek.com/
2. Create an account
3. Get your API key from the API section

### Database Setup
1. Set up a MySQL database (you can use services like PlanetScale, Railway, or local MySQL)
2. Get your connection details
3. Run the database initialization: `curl http://localhost:3000/api/init-db`

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Rotate API keys regularly
- Use environment-specific configurations for different deployments

## Troubleshooting

If you see authentication errors:
1. Make sure `NEXTAUTH_SECRET` is set
2. Restart your development server after adding environment variables
3. Check that all required variables are present and correctly formatted 