import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [city, setCity] = useState(
    () => localStorage.getItem("lastCity") || ""
  );
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("celsius");
  const [searchTerm, setSearchTerm] = useState("");

  // Auth states
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedCities, setSavedCities] = useState([]);

  const API_KEY = "2dd5f9c0cd712493c3377e3d6a8748ab"; // Replace with your API key

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchSavedCities();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchSavedCities();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSavedCities = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_cities")
        .select("city_name, country, weather_data, last_updated");

      if (error) throw error;
      setSavedCities(
        data.map((item) => ({
          name: item.city_name,
          country: item.country,
          lastUpdated: new Date(item.last_updated),
          weatherData: item.weather_data,
        }))
      );
    } catch (error) {
      console.error("Error fetching saved cities:", error);
    }
  };

  const saveCity = async (cityName) => {
    try {
      if (!weatherData) return;

      const { error } = await supabase.from("saved_cities").insert([
        {
          user_id: session.user.id,
          city_name: cityName,
          country: weatherData.sys.country,
          weather_data: weatherData,
          last_updated: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      fetchSavedCities();
    } catch (error) {
      console.error("Error saving city:", error);
    }
  };

  const removeCity = async (cityName) => {
    try {
      const { error } = await supabase
        .from("saved_cities")
        .delete()
        .eq("city_name", cityName);

      if (error) throw error;
      fetchSavedCities();
    } catch (error) {
      console.error("Error removing city:", error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert("Check your email for the confirmation link!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSavedCities([]);
  };

  const fetchWeatherData = async (searchCity) => {
    try {
      setLoading(true);
      setError(null);

      // Current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=metric`
      );

      if (!weatherResponse.ok) {
        throw new Error("City not found or network error");
      }

      const weatherResult = await weatherResponse.json();
      setWeatherData(weatherResult);

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&appid=${API_KEY}&units=metric`
      );

      if (forecastResponse.ok) {
        const forecastResult = await forecastResponse.json();
        setForecast(forecastResult);
      }

      localStorage.setItem("lastCity", searchCity);
      setCity(searchCity);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    if (city) {
      fetchWeatherData(city);
      const interval = setInterval(() => {
        fetchWeatherData(city);
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    }
  }, [city]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchWeatherData(searchTerm.trim());
      setSearchTerm("");
    }
  };

  const convertTemp = (temp) => {
    if (unit === "fahrenheit") {
      return ((temp * 9) / 5 + 32).toFixed(1);
    }
    return temp.toFixed(1);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Weather Dashboard
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSignIn}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Weather Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter city name..."
              className="w-full px-4 py-2 text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white font-medium hover:bg-blue-600 focus:outline-none"
            >
              Search
            </button>
          </div>
        </form>

        {/* Saved Cities */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Saved Cities</h3>
          <div className="flex flex-wrap gap-2">
            {savedCities.map((savedCity) => (
              <div
                key={savedCity.name}
                className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <button
                    onClick={() => fetchWeatherData(savedCity.name)}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    {savedCity.name}, {savedCity.country}
                  </button>
                  <div className="text-xs text-gray-500">
                    Last updated: {savedCity.lastUpdated.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => removeCity(savedCity.name)}
                  className="ml-3 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Toggle */}
        <div className="mb-4">
          <button
            onClick={() =>
              setUnit(unit === "celsius" ? "fahrenheit" : "celsius")
            }
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Switch to {unit === "celsius" ? "°F" : "°C"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600">
            Loading weather data...
          </div>
        )}

        {/* Weather Display */}
        {weatherData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{weatherData.name}</h2>
              {!savedCities.some((city) => city.name === weatherData.name) && (
                <button
                  onClick={() => saveCity(weatherData.name)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Save City
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                  alt={weatherData.weather[0].description}
                  className="w-20 h-20"
                />
                <p className="text-4xl font-bold">
                  {convertTemp(weatherData.main.temp)}°
                  {unit === "celsius" ? "C" : "F"}
                </p>
                <p className="text-gray-600 capitalize">
                  {weatherData.weather[0].description}
                </p>
              </div>
              <div>
                <p>Humidity: {weatherData.main.humidity}%</p>
                <p>Wind Speed: {weatherData.wind.speed} m/s</p>
                <p>Pressure: {weatherData.main.pressure} hPa</p>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">5-Day Forecast</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.list
                .filter((item, index) => index % 8 === 0) // Get one reading per day
                .map((item, index) => (
                  <div
                    key={index}
                    className="text-center p-4 bg-gray-50 rounded"
                  >
                    <p className="font-medium">
                      {new Date(item.dt * 1000).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                      alt={item.weather[0].description}
                      className="mx-auto"
                    />
                    <p>
                      {convertTemp(item.main.temp)}°
                      {unit === "celsius" ? "C" : "F"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
