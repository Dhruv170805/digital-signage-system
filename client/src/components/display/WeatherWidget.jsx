import React, { useState, useEffect } from 'react';
import { CloudSun, MapPin } from 'lucide-react';
import io from 'socket.io-client';

const WeatherWidget = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Local');

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (mounted && data?.current_weather) {
          setTemp(Math.round(data.current_weather.temperature));
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation denied or failed. Fallback to NY.', err);
          fetchWeather(40.7128, -74.0060); // New York
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      fetchWeather(40.7128, -74.0060);
    }

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude));
      }
    }, 900000); // 15 mins

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const tempF = temp !== '--' ? Math.round(Number(temp) * 9/5 + 32) : '--';

  return (
    <div className="flex items-center gap-[2vw] px-[2vw] py-[1vh] bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-[1vw]">
        <div className="w-[3vw] h-[3vw] min-w-[40px] min-h-[40px] rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <MapPin size={24} className="text-blue-400 w-[1.5vw] h-[1.5vw] min-w-[20px] min-h-[20px]" />
        </div>
        <span className="text-[min(2vw,1.5rem)] font-black uppercase tracking-[2px] text-text/80 truncate max-w-[15vw]">{area}</span>
      </div>
      <div className="h-[4vh] w-px bg-white/10" />
      <div className="flex items-center gap-[1vw]">
        <div className="w-[3vw] h-[3vw] min-w-[40px] min-h-[40px] rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <CloudSun size={24} className="text-amber-400 w-[1.5vw] h-[1.5vw] min-w-[20px] min-h-[20px]" />
        </div>
        <div className="flex items-baseline gap-[0.5vw]">
          <span className="text-[min(4vw,3rem)] font-black tracking-tighter text-text tabular-nums">{temp}°C</span>
          <span className="text-[min(2vw,1.5rem)] font-bold tracking-tighter text-text/40 tabular-nums">/ {tempF}°F</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
