import React, { useState, useEffect } from 'react';
import { CloudSun, MapPin } from 'lucide-react';
import io from 'socket.io-client';

const WeatherWidget = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Detecting...');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on('weatherUpdate', (weatherData) => {
      // Prioritize the screen's actual location or use the fallback from weatherData (often 'New York')
      const locKey = location || Object.keys(weatherData)[0] || 'New York';
      const data = weatherData[locKey] || weatherData['New York'];
      if (data) {
        setTemp(data.temp);
        setArea(data.area);
      }
    });

    return () => socket.disconnect();
  }, [location]);

  const tempF = temp !== '--' ? Math.round(Number(temp) * 9/5 + 32) : '--';

  return (
    <div className="flex items-center gap-8 px-8 py-4 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <MapPin size={24} className="text-blue-400" />
        </div>
        <span className="text-xl font-black uppercase tracking-[2px] text-text/80 truncate max-w-[250px]">{area}</span>
      </div>
      <div className="h-10 w-px bg-white/10" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <CloudSun size={24} className="text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tighter text-text tabular-nums">{temp}°C</span>
          <span className="text-2xl font-bold tracking-tighter text-text/40 tabular-nums">/ {tempF}°F</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
