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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weather Dashboard
          </h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex space-x-4 pt-2">
              <button
                onClick={handleSignIn}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weather Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a city..."
              className="w-full px-6 py-4 text-lg rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </form>

        {/* Unit Toggle and Error/Loading States */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() =>
              setUnit(unit === "celsius" ? "fahrenheit" : "celsius")
            }
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-gray-700 font-medium"
          >
            Switch to {unit === "celsius" ? "°F" : "°C"}
          </button>

          {error && (
            <div className="flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-lg">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center text-blue-600">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </div>
          )}
        </div>

        {/* Saved Cities */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Saved Cities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCities.map((savedCity) => (
              <div
                key={savedCity.name}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <button
                      onClick={() => fetchWeatherData(savedCity.name)}
                      className="text-lg font-medium text-blue-600 hover:text-blue-700"
                    >
                      {savedCity.name}, {savedCity.country}
                    </button>
                    <div className="text-sm text-gray-500 mt-1">
                      Last updated: {savedCity.lastUpdated.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCity(savedCity.name)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Weather */}
        {weatherData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {weatherData.name}
                </h2>
                <p className="text-gray-500">{weatherData.sys.country}</p>
              </div>
              {!savedCities.some((city) => city.name === weatherData.name) && (
                <button
                  onClick={() => saveCity(weatherData.name)}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Save City
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center">
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                  alt={weatherData.weather[0].description}
                  className="w-32 h-32"
                />
                <div>
                  <p className="text-5xl font-bold text-gray-800">
                    {convertTemp(weatherData.main.temp)}°
                    {unit === "celsius" ? "C" : "F"}
                  </p>
                  <p className="text-xl text-gray-600 capitalize mt-2">
                    {weatherData.weather[0].description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm mb-1">Humidity</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {weatherData.main.humidity}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm mb-1">Wind Speed</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {weatherData.wind.speed} m/s
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm mb-1">Pressure</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {weatherData.main.pressure} hPa
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm mb-1">Feels Like</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {convertTemp(weatherData.main.feels_like)}°
                    {unit === "celsius" ? "C" : "F"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              5-Day Forecast
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.list
                .filter((item, index) => index % 8 === 0)
                .map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 text-center"
                  >
                    <p className="font-medium text-gray-800 mb-2">
                      {new Date(item.dt * 1000).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                      alt={item.weather[0].description}
                      className="w-16 h-16 mx-auto"
                    />
                    <p className="text-lg font-semibold text-gray-800">
                      {convertTemp(item.main.temp)}°
                      {unit === "celsius" ? "C" : "F"}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.weather[0].description}
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
