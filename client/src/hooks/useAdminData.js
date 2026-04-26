import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useScreens = () => useQuery({
  queryKey: ['screens'],
  queryFn: async () => {
    const res = await api.get('/api/screens');
    return res.data;
  },
  refetchInterval: 10000 // Polling fallback for status updates
});

export const useMedia = () => useQuery({
  queryKey: ['media'],
  queryFn: async () => {
    const res = await api.get('/api/media');
    return res.data;
  }
});

export const usePendingMedia = () => useQuery({
  queryKey: ['pendingMedia'],
  queryFn: async () => {
    const res = await api.get('/api/media/pending');
    return res.data;
  }
});

export const useMyMedia = () => useQuery({
  queryKey: ['myMedia'],
  queryFn: async () => {
    const res = await api.get('/api/media/me');
    return res.data;
  }
});

export const usePendingAssignments = () => useQuery({
  queryKey: ['pendingAssignments'],
  queryFn: async () => {
    const res = await api.get('/api/schedule');
    return res.data.filter(a => a.status === 'pending');
  }
});

export const useTemplates = () => useQuery({
  queryKey: ['templates'],
  queryFn: async () => {
    const res = await api.get('/api/templates');
    return res.data;
  }
});

export const useTickers = () => useQuery({
  queryKey: ['tickers'],
  queryFn: async () => {
    const res = await api.get('/api/ticker');
    return res.data;
  }
});

export const useSchedules = () => useQuery({
  queryKey: ['schedules'],
  queryFn: async () => {
    const res = await api.get('/api/schedule');
    return res.data;
  }
});

export const useUsers = () => useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const res = await api.get('/api/auth/users');
    return res.data;
  }
});

export const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: async () => {
    const res = await api.get('/api/settings');
    return res.data;
  }
});

export const useHistoryLogs = () => useQuery({
  queryKey: ['historyLogs'],
  queryFn: async () => {
    const res = await api.get('/api/history');
    return res.data;
  },
  refetchInterval: 30000 // Refresh logs every 30s
});
