import React, { useState, useEffect } from 'react';
import { CloudSun, MapPin } from 'lucide-react';
import io from 'socket.io-client';

const WeatherWidget = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Locating...');

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async (lat, lon, name = null) => {
      try {
        // High-Precision Reverse Geocoding
        if (!name) {
          try {
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
                  headers: { 'User-Agent': 'NexusSignageSystem/1.1' }
              });
              const geoData = await geoRes.json();
              if (mounted && geoData?.address) {
                  // Prioritize Suburb/Neighborhood for "High Accuracy" feel
                  name = geoData.address.suburb || 
                         geoData.address.neighbourhood || 
                         geoData.address.district || 
                         geoData.address.city_district || 
                         geoData.address.city || 
                         geoData.address.town || 'Secure Hub';
              }
          } catch (geoErr) {
              console.warn('Reverse geocoding failed:', geoErr);
          }
        }

        if (mounted && name) setArea(name);

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (mounted && data?.current_weather) {
          setTemp(Math.round(data.current_weather.temperature));
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    const initWeather = async () => {
      // 1. Check for manual location override from Admin
      if (location) {
        try {
          const searchRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
          const searchData = await searchRes.json();
          if (searchData && searchData[0]) {
            fetchWeather(searchData[0].lat, searchData[0].lon, location);
            return;
          }
        } catch (e) {
          console.warn('Manual location geocode failed:', e);
        }
      }

      // 2. High-Accuracy Browser Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          async () => {
            // 3. Ultra-Reliable IP-based Fallback (No user prompt needed)
            try {
              const ipRes = await fetch('https://ipapi.co/json/');
              const ipData = await ipRes.json();
              if (mounted && ipData.latitude) {
                fetchWeather(ipData.latitude, ipData.longitude, ipData.city || "Vadodara");
              }
            } catch (ipErr) {
              fetchWeather(22.3072, 73.1812, "Vadodara");
            }
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        // 4. Global Fallback
        fetchWeather(22.3072, 73.1812, "Vadodara");
      }
    };

    initWeather();
    const interval = setInterval(initWeather, 900000); // 15 mins sync

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location]);

  const tempF = temp !== '--' ? Math.round(Number(temp) * 9/5 + 32) : '--';

  return (
    <div className="flex items-center gap-6">
        <div className="flex flex-col">
            <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[3px] leading-none mb-1">Local Node</p>
            <p className="text-sm font-black text-white uppercase tracking-wider">{area}</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <CloudSun size={20} className="text-amber-400" />
            </div>
            <div>
                <p className="text-[9px] font-black text-amber-400/60 uppercase tracking-[3px] leading-none mb-1">Ambient</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white uppercase tabular-nums">{temp}°C</span>
                    <span className="text-[10px] font-bold text-white/30 tabular-nums uppercase">/ {tempF}°F</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default WeatherWidget;
