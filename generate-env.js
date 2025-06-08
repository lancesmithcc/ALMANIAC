#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random secret for NextAuth
function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

// Create the .env.local file template
function createEnvFile() {
  const secret = generateSecret();
  
  const envContent = `# NextAuth Configuration
NEXTAUTH_SECRET=${secret}
NEXTAUTH_URL=http://localhost:3000

# Weather API (Get from https://www.weatherapi.com/)
WEATHER_API_KEY=your_weather_api_key_here

# DeepSeek AI (Get from https://platform.deepseek.com/)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Database Configuration (MySQL/FreeSQL)
FREESQL_HOST=your_database_host
FREESQL_DATABASE_NAME=almaniac_db
FREESQL_DATABASE_USER=your_database_user
FREESQL_DATABASE_PASSWORD=your_database_password
FREESQL_DATABASE_PORT_NUMBER=3306

# Optional: App URL for production
# NEXT_PUBLIC_APP_URL=https://your-app-domain.com
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Creating .env.local.example instead.');
    fs.writeFileSync(path.join(process.cwd(), '.env.local.example'), envContent);
    console.log('✅ Created .env.local.example with generated secret');
    console.log('📝 Copy .env.local.example to .env.local and fill in your API keys');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local with generated secret');
    console.log('📝 Please edit .env.local and add your API keys and database credentials');
  }
  
  console.log('\n🔑 Generated NextAuth Secret:', secret);
  console.log('\n📋 Next steps:');
  console.log('1. Get Weather API key from: https://www.weatherapi.com/');
  console.log('2. Get DeepSeek API key from: https://platform.deepseek.com/');
  console.log('3. Set up your MySQL database credentials');
  console.log('4. Restart your development server: npm run dev');
  console.log('\n📖 See ENVIRONMENT_SETUP.md for detailed instructions');
}

// Run the script
if (require.main === module) {
  createEnvFile();
}

module.exports = { generateSecret, createEnvFile }; 