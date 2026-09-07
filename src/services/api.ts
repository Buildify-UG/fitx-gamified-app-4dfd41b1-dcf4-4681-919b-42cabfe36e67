import { User, UserProfile, Workout, WorkoutSchedule, AIStatus } from '@/types/fitx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  // Auth
  register: async (email: string, username: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Profile
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const res = await fetch(`${API_URL}/api/v1/profile/${userId}`);
    if (!res.ok) return null;
    return res.json();
  },

  saveProfile: async (profile: UserProfile): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/v1/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Workouts
  generateWorkout: async (userId: string): Promise<{ workout: Workout; schedule: WorkoutSchedule[] }> => {
    const res = await fetch(`${API_URL}/api/v1/workouts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getTodayWorkout: async (userId: string): Promise<Workout | null> => {
    const res = await fetch(`${API_URL}/api/v1/workouts/today/${userId}`);
    if (!res.ok) return null;
    return res.json();
  },

  getSchedule: async (userId: string): Promise<WorkoutSchedule[]> => {
    const res = await fetch(`${API_URL}/api/v1/workouts/schedule/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getWorkout: async (workoutId: string): Promise<Workout | null> => {
    const res = await fetch(`${API_URL}/api/v1/workouts/${workoutId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // AI Status
  getAIStatus: async (): Promise<AIStatus> => {
    const res = await fetch(`${API_URL}/api/v1/ai/status`);
    if (!res.ok) throw new Error('Failed to fetch AI status');
    return res.json();
  },
};
