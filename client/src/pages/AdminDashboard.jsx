import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Calendar, Type, Layout as LayoutIcon } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200">
      {/* Sidebar */}
      <div className="w-64 glass-effect border-r border-white/5 flex flex-col z-10">
        <div className="p-6 text-2xl font-black gradient-text tracking-tight">
          NEXUS SIGNAGE
        </div>
        <nav className="flex-1 mt-6 px-3">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'upload' ? 'bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            <Upload className={`mr-3 transition-colors ${activeTab === 'upload' ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} size={20} /> Media Upload
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group mt-2 ${activeTab === 'schedule' ? 'bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className={`mr-3 transition-colors ${activeTab === 'schedule' ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} size={20} /> Schedule
          </button>
          <button 
            onClick={() => setActiveTab('ticker')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group mt-2 ${activeTab === 'ticker' ? 'bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            <Type className={`mr-3 transition-colors ${activeTab === 'ticker' ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} size={20} /> Ticker Text
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group mt-2 ${activeTab === 'templates' ? 'bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutIcon className={`mr-3 transition-colors ${activeTab === 'templates' ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} size={20} /> Templates
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-10 bg-[radial-gradient(circle_at_bottom_left,#1e1b4b,transparent_40%)]">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white capitalize tracking-tight mb-2">{activeTab} Management</h1>
          <p className="text-slate-400">Orchestrate your signage network with precision.</p>
        </header>

        <div className="glass-effect rounded-3xl p-8 premium-card border border-white/10">
          {activeTab === 'upload' && <MediaUpload />}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'ticker' && <TickerManager />}
          {activeTab === 'templates' && <TemplateBuilder />}
        </div>
      </div>
    </div>
  );
};

const TickerManager = () => {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTicker();
  }, []);

  const fetchTicker = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/ticker');
      setText(res.data.text);
      setSpeed(res.data.speed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5005/api/ticker', { text, speed });
      alert('Ticker updated on all screens!');
    } catch (err) {
      alert('Failed to update ticker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-blue-700 text-sm">
          <strong>Tip:</strong> Updating this text will reflect instantly on all active display screens via WebSockets.
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scrolling Message</label>
          <textarea 
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the news, announcement, or welcome message here..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scroll Speed: {speed}</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        <button 
          disabled={loading}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition shadow-lg"
        >
          {loading ? 'Updating...' : 'Update Live Ticker'}
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Live Preview</h3>
        <div className="h-16 bg-red-600 text-white flex items-center overflow-hidden rounded-lg shadow-inner">
          <div 
            className="whitespace-nowrap animate-marquee text-xl font-bold px-4"
            style={{ animationDuration: `${30 - speed}s` }}
          >
            {text || 'Your message will appear here...'} — {text} — {text}
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateBuilder = () => {
  const [name, setName] = useState('New Template');
  const [zones, setZones] = useState([
    { id: 'media', name: 'Media Zone', x: 0, y: 0, w: 100, h: 90, color: 'bg-blue-100' },
    { id: 'ticker', name: 'Ticker Zone', x: 0, y: 90, w: 100, h: 10, color: 'bg-red-100' }
  ]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await axios.get('http://localhost:5005/api/templates');
    setTemplates(res.data);
  };

  const updateZone = (id, field, value) => {
    setZones(zones.map(z => z.id === id ? { ...z, [field]: parseInt(value) } : z));
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5005/api/templates', { name, layout: zones });
      alert('Template saved!');
      fetchTemplates();
    } catch (err) {
      alert('Error saving template');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Template Name</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {zones.map(zone => (
          <div key={zone.id} className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold mb-3">{zone.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">X Position (%)</label>
                <input type="range" min="0" max="100" value={zone.x} onChange={(e) => updateZone(zone.id, 'x', e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y Position (%)</label>
                <input type="range" min="0" max="100" value={zone.y} onChange={(e) => updateZone(zone.id, 'y', e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Width (%)</label>
                <input type="range" min="1" max="100" value={zone.w} onChange={(e) => updateZone(zone.id, 'w', e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height (%)</label>
                <input type="range" min="1" max="100" value={zone.h} onChange={(e) => updateZone(zone.id, 'h', e.target.value)} className="w-full" />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Save Template
        </button>

        <div className="mt-10">
          <h3 className="font-bold mb-4">Existing Templates</h3>
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 border rounded">
                <span>{t.name}</span>
                <button className="text-red-500 text-sm">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="sticky top-10">
        <h3 className="font-bold mb-4 text-center">Layout Preview (16:9)</h3>
        <div className="aspect-video bg-gray-200 border-4 border-gray-400 rounded-lg relative overflow-hidden shadow-2xl">
          {zones.map(zone => (
            <div 
              key={zone.id}
              className={`absolute border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-600 font-bold ${zone.color}`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
                transition: 'all 0.2s ease-out'
              }}
            >
              {zone.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScheduleManager = () => {
  const [mediaList, setMediaList] = useState([]);
  const [templateList, setTemplateList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({
    mediaId: '',
    templateId: '',
    startTime: '',
    endTime: '',
    duration: 30
  });

  useEffect(() => {
    fetchMedia();
    fetchTemplates();
    fetchSchedules();
  }, []);

  const fetchMedia = async () => {
    const res = await axios.get('http://localhost:5005/api/media');
    setMediaList(res.data);
  };

  const fetchTemplates = async () => {
    const res = await axios.get('http://localhost:5005/api/templates');
    setTemplateList(res.data);
  };

  const fetchSchedules = async () => {
    const res = await axios.get('http://localhost:5005/api/schedule');
    setSchedules(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5005/api/schedule', formData);
      alert('Schedule added!');
      fetchSchedules();
    } catch (err) {
      alert('Error creating schedule');
    }
  };

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Media</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={formData.mediaId}
            onChange={(e) => setFormData({...formData, mediaId: e.target.value})}
            required
          >
            <option value="">-- Choose File --</option>
            {mediaList.map(m => (
              <option key={m.id} value={m.id}>{m.fileName} ({m.fileType})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={formData.templateId}
            onChange={(e) => setFormData({...formData, templateId: e.target.value})}
          >
            <option value="">-- Default Fullscreen --</option>
            {templateList.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Seconds)</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded-md"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            required
          />
        </div>
        <div /> 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input 
            type="datetime-local" 
            className="w-full p-2 border rounded-md"
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input 
            type="datetime-local" 
            className="w-full p-2 border rounded-md"
            value={formData.endTime}
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            required
          />
        </div>
        <div className="md:col-span-2">
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
            Create Schedule
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border">Media</th>
              <th className="p-3 border">Template</th>
              <th className="p-3 border">Start</th>
              <th className="p-3 border">End</th>
              <th className="p-3 border">Duration</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id}>
                <td className="p-3 border">{s.fileName}</td>
                <td className="p-3 border">{s.templateName || 'Fullscreen'}</td>
                <td className="p-3 border">{new Date(s.startTime).toLocaleString()}</td>
                <td className="p-3 border">{new Date(s.endTime).toLocaleString()}</td>
                <td className="p-3 border">{s.duration}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MediaUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      await axios.post('http://localhost:5005/api/media/upload', formData);
      alert('Uploaded successfully!');
      setFile(null);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition cursor-pointer relative">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,image/*"
          />
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 font-medium">
            {file ? file.name : "Click or drag to upload PDF or Image"}
          </p>
        </div>
        <button 
          disabled={!file || uploading}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
        >
          {uploading ? 'Uploading...' : 'Upload Now'}
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;
