import React, { useState, useEffect } from 'react';
import { CloudSun, MapPin } from 'lucide-react';
import io from 'socket.io-client';

const WeatherWidget = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Detecting...');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on('weatherUpdate', (weatherData) => {
      const locKey = location || 'New York';
      const data = weatherData[locKey];
      if (data) {
        setTemp(data.temp);
        setArea(data.area);
      }
    });

    return () => socket.disconnect();
  }, [location]);

  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-white/5 rounded-[20px] border border-white/10 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <MapPin size={14} className="text-blue-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[2px] text-text/60 truncate max-w-[150px]">{area}</span>
      </div>
      <div className="h-6 w-px bg-white/10" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <CloudSun size={16} className="text-amber-400" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-text tabular-nums">{temp}°C</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
