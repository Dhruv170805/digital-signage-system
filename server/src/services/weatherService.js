const axios = require('axios');
const Setting = require('../models/Setting');

class WeatherService {
  constructor() {
    this.weatherCache = new Map(); // Map of location -> weather data
    this.defaultLocation = 'New York';
  }

  async init(io) {
    this.io = io;
    this.fetchWeather();
    // Fetch weather every 10 minutes
    setInterval(() => this.fetchWeather(), 10 * 60 * 1000);
  }

  async fetchWeather() {
    try {
      // Get all unique locations from active screens
      const Screen = require('../models/Screen');
      const screens = await Screen.find({ isActive: true });
      const locations = [...new Set(screens.map(s => s.location).filter(Boolean))];
      
      if (locations.length === 0) {
          locations.push(this.defaultLocation);
      }

      for (const location of locations) {
        try {
          const apiKey = process.env.OPENWEATHER_API_KEY;
          let temp = '--';
          let area = location;

          if (apiKey) {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
            const res = await axios.get(url);
            if (res.data && res.data.main) {
              temp = Math.round(res.data.main.temp);
              area = res.data.name;
            }
          } else {
            const res = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=%t+%C`);
            if (typeof res.data === 'string' && res.data.includes(' ')) {
                temp = res.data.split(' ')[0].replace('+', '');
            } else {
                temp = res.data.replace('+', '');
            }
          }

          this.weatherCache.set(location, { temp, area });
        } catch (error) {
          console.error(`Failed to fetch weather for ${location}:`, error.message);
        }
      }

      // Broadcast weather updates to connected clients
      if (this.io) {
        this.io.emit('weatherUpdate', Object.fromEntries(this.weatherCache));
      }
    } catch (error) {
      console.error('Weather service error:', error.message);
    }
  }

  getWeather(location) {
    return this.weatherCache.get(location) || this.weatherCache.get(this.defaultLocation) || { temp: '--', area: location || 'Detecting...' };
  }
}

module.exports = new WeatherService();
