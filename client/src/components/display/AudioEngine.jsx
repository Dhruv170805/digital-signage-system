import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- IndexedDB Utility ---
const DB_NAME = 'NexusAudioCache';
const STORE_NAME = 'audio_blobs';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const getCachedAudio = async (url) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const cacheAudio = async (url, blob) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(blob, url);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// --- AudioEngine Component ---
const AudioEngine = ({ assignments = [], settings = {}, socket }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [priority, setPriority] = useState('low'); // low, medium, high
  const [liveVolume, setLiveVolume] = useState(null);
  
  const audioRef = useRef(new Audio());
  const activeAssignmentRef = useRef(null);

  // ... (getAudioUrl and playTrack remain the same)

  useEffect(() => {
    if (!socket) return;

    socket.on('audio:volume', (data) => {
      setLiveVolume(data.volume);
    });

    socket.on('audio:control', (data) => {
      if (data.action === 'pause' || data.action === 'stop') {
        audioRef.current.pause();
      } else if (data.action === 'play') {
        audioRef.current.play();
      }
    });

    return () => {
      socket.off('audio:volume');
      socket.off('audio:control');
    };
  }, [socket]);

  // Handle volume changes (Live > Setting > Default)
  useEffect(() => {
    const vol = liveVolume !== null ? liveVolume : (settings.globalVolume || 100);
    audioRef.current.volume = vol / 100;
  }, [settings.globalVolume, liveVolume]);

  const getAudioUrl = useCallback((path) => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${apiBase}/${path}`.replace(/([^:]\/)\/+/g, "$1");
  }, []);

  const playTrack = useCallback(async (track) => {
    if (!track || !track.path) return;
    
    const url = getAudioUrl(track.path);
    let audioSrc = url;

    try {
      const cachedBlob = await getCachedAudio(url);
      if (cachedBlob) {
        audioSrc = URL.createObjectURL(cachedBlob);
      } else {
        // Fetch and cache
        const response = await fetch(url);
        const blob = await response.blob();
        await cacheAudio(url, blob);
        audioSrc = URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn('AudioEngine: Cache failure, falling back to network', err);
    }

    audioRef.current.src = audioSrc;
    audioRef.current.volume = (settings.globalVolume || 100) / 100;
    
    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('AudioEngine: Playback failed', err);
    }
  }, [getAudioUrl, settings.globalVolume]);

  // Priority Logic & Assignment Selection
  useEffect(() => {
    if (!assignments || assignments.length === 0) {
      audioRef.current.pause();
      activeAssignmentRef.current = null;
      return;
    }

    // Sort by priority (high > medium > low) and then by creation date
    const priorityMap = { high: 3, medium: 2, low: 1 };
    const sorted = [...assignments].sort((a, b) => {
      const pa = priorityMap[a.priority] || 1;
      const pb = priorityMap[b.priority] || 1;
      if (pb !== pa) return pb - pa;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const topAssignment = sorted[0];

    if (activeAssignmentRef.current?._id !== topAssignment._id) {
      console.log(`AudioEngine: Switching to assignment "${topAssignment.name}" (Priority: ${topAssignment.priority})`);
      activeAssignmentRef.current = topAssignment;
      setPriority(topAssignment.priority);
      
      const playlist = topAssignment.playlistId?.audios || [];
      setCurrentPlaylist(playlist);
      setCurrentTrackIdx(0);
      
      if (playlist.length > 0) {
        playTrack(playlist[0]);
      }
    }
  }, [assignments, playTrack]);

  // Handle track end & looping
  useEffect(() => {
    const handleEnded = () => {
      if (currentPlaylist.length === 0) return;
      
      const nextIdx = (currentTrackIdx + 1) % currentPlaylist.length;
      
      // If we reached the end and it's not a loop, we might stop, 
      // but usually playlists loop in signage.
      setCurrentTrackIdx(nextIdx);
      playTrack(currentPlaylist[nextIdx]);
    };

    const audio = audioRef.current;
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentPlaylist, currentTrackIdx, playTrack]);

  // Handle volume changes
  useEffect(() => {
    audioRef.current.volume = (settings.globalVolume || 100) / 100;
  }, [settings.globalVolume]);

  return null; // Invisible component
};

export default AudioEngine;
