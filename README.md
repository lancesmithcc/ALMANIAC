# 🌱 Almaniac - Smart Farming Dashboard

A modern, AI-powered almanac application for tracking plants, weather, and land management with intelligent insights powered by DeepSeek AI.

## ✨ Features

- **🌤️ Real-time Weather Integration** - Automatic weather data fetching and storage
- **🌱 Plant & Land Management** - Track plant health, growth stages, and locations
- **🧠 AI-Powered Recommendations** - Get intelligent farming advice from DeepSeek AI
- **📊 Analytics Dashboard** - Visual insights into your farming data
- **📝 Activity Logging** - Track watering, pruning, harvesting, and observations
- **🌙 Dark Theme** - Modern, eye-friendly interface
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database (FreeSQL or any MySQL-compatible database)
- Weather API key from [WeatherAPI.com](https://www.weatherapi.com/)
- DeepSeek API key from [DeepSeek](https://www.deepseek.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd almaniac
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Weather API
   WEATHER_API_KEY=your_weather_api_key_here
   
   # DeepSeek AI API
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   
   # FreeSQL Database Connection
   FREESQL_HOST=your_database_host
   FREESQL_DATABASE_NAME=your_database_name
   FREESQL_DATABASE_USER=your_database_user
   FREESQL_DATABASE_PORT_NUMBER=your_database_port
   FREESQL_DATABASE_PASSWORD=your_database_password
   ```

4. **Initialize the database**
   ```bash
   npm run dev
   ```
   Then visit `http://localhost:3000/api/init-db` (POST request) to create the database tables.

5. **Start the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000` to see your almanac dashboard!

## 🎯 Usage

### Dashboard Overview
- View current weather conditions
- See plant health analytics
- Monitor recent activities
- Get AI-powered insights and recommendations

### Plant Management
1. Click "Plants & Land" in the navigation
2. Use "Add Entry" to record new plants
3. Track growth stages, health status, and notes
4. View all your plants in an organized grid

### Weather Tracking
- Weather data is automatically fetched and stored
- View detailed weather information in the Weather tab
- Historical weather data is saved for AI analysis

### AI Recommendations
- The AI analyzes your plants, weather, and activities
- Get personalized recommendations for watering, fertilizing, pest control
- Recommendations are prioritized by urgency
- Access via the dashboard or API endpoints

## 🔧 API Endpoints

### Weather
- `GET /api/weather` - Get current weather data
- `POST /api/weather` - Add manual weather entry

### Plants
- `GET /api/plants` - Get all plants
- `POST /api/plants` - Create new plant entry
- `PUT /api/plants` - Update plant information
- `DELETE /api/plants?id={id}` - Delete plant

### AI Analysis
- `POST /api/ai/analyze` - Get AI recommendations
- `GET /api/ai/analyze` - Get stored recommendations

### Database
- `GET /api/init-db` - Test database connection
- `POST /api/init-db` - Initialize database tables

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: MySQL (FreeSQL compatible)
- **APIs**: WeatherAPI.com, DeepSeek AI
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── WeatherWidget.tsx  # Weather display
│   ├── PlantEntryForm.tsx # Plant management
│   ├── AnalyticsCards.tsx # Analytics display
│   └── RecentEntries.tsx  # Activity feed
├── lib/                   # Utility libraries
│   └── database.ts        # Database operations
└── types/                 # TypeScript definitions
    └── index.ts           # Type definitions
```

## 🌟 Key Features Explained

### Smart Weather Integration
- Automatically fetches weather data based on location
- Stores historical weather for trend analysis
- Provides weather-based plant care recommendations

### AI-Powered Insights
- Analyzes plant health, weather patterns, and care activities
- Provides actionable recommendations with confidence scores
- Learns from your farming patterns over time

### Plant Health Tracking
- Monitor growth stages from seed to harvest
- Track health status with visual indicators
- Log activities and observations with timestamps

### Modern UI/UX
- Dark theme optimized for outdoor use
- Responsive design for mobile and desktop
- Intuitive navigation with emoji indicators
- Loading states and error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Weather data provided by [WeatherAPI.com](https://www.weatherapi.com/)
- AI insights powered by [DeepSeek](https://www.deepseek.com/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

---

Happy farming! 🌾✨
