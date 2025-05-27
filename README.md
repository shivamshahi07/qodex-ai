# Weather Dashboard

A modern, responsive weather dashboard built with React.js, Vite, and Tailwind CSS. This application provides real-time weather information, 5-day forecasts, and user authentication with saved city preferences.

![Weather Dashboard Screenshot]
[Add your application screenshot here]

## 🌟 Features

### Core Features

- **Real-time Weather Data**

  - Current temperature, humidity, wind speed, and weather conditions
  - Weather icons for visual representation
  - Feels like temperature and pressure information
  - Auto-refresh every 30 seconds

- **Location Search**

  - Search for any city worldwide
  - Error handling for invalid city names
  - Automatic loading states during searches

- **Temperature Units**

  - Toggle between Celsius and Fahrenheit
  - Persistent unit preference

- **5-Day Weather Forecast**
  - Daily weather predictions
  - Temperature trends
  - Weather conditions with icons
  - Detailed daily information

### User Features

- **Authentication System**

  - Email/Password authentication using Supabase
  - Secure user sessions
  - Protected routes and data

- **Saved Cities**
  - Save favorite cities for quick access
  - Automatic weather updates for saved cities
  - Remove cities from saved list
  - Last updated timestamp for each city

### Technical Features

- **State Management**

  - Efficient state handling with React hooks
  - Local storage for persistent data
  - Real-time data synchronization

- **API Integration**

  - OpenWeatherMap API for weather data
  - Supabase for authentication and data storage
  - Error handling for API failures

- **Responsive Design**
  - Mobile-first approach
  - Modern UI with Tailwind CSS
  - Smooth animations and transitions
  - Loading states and error messages

## 🛠️ Technology Stack

- **Frontend Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **API**: OpenWeatherMap
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenWeatherMap API key
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd weather-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```env
   VITE_OPENWEATHER_API_KEY=your_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Implementation Details

### Database Schema

```sql
CREATE TABLE saved_cities (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
city_name TEXT NOT NULL,
country TEXT NOT NULL,
weather_data JSONB,
last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Integration

- **Weather Data Fetching**:
```javascript
  fetch(\`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=\${API_KEY}&units=metric\`)
  ```

- **5-Day Forecast**:
  ```javascript
  fetch(\`https://api.openweathermap.org/data/2.5/forecast?q=\${city}&appid=\${API_KEY}&units=metric\`)
  ```

### Auto-Refresh Implementation

```javascript
useEffect(() => {
  if (city) {
    fetchWeatherData(city);
    const interval = setInterval(() => {
      fetchWeatherData(city);
    }, 30000);
    return () => clearInterval(interval);
  }
}, [city]);
```

## 🔒 Security Features

- Environment variables for API keys
- Secure authentication with Supabase
- Protected API endpoints
- Data validation and sanitization

## 📱 Responsive Design

The application is fully responsive and works on:

- Mobile devices
- Tablets
- Desktop computers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- Supabase for authentication and database
- Tailwind CSS for styling
- Vercel for hosting
