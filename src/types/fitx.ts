export interface User {
  id: string;
  email: string;
  username: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  fitnessLevel: string;
  fitnessGoal: string;
  equipment: string[];
  limitations: string[];
  preferences: string;
  region: string;
  currentRP: number;
  currentRank: string;
}

export interface Exercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  targetMuscles: string[];
  equipment: string;
  difficulty: number;
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  durationMinutes: number;
  exercises: Exercise[];
  difficulty: number;
  createdAt: string;
  completedAt?: string;
}

export interface WorkoutSchedule {
  id: string;
  userId: string;
  dayNumber: number;
  scheduledDate: string;
  status: 'pending' | 'ready' | 'active' | 'completed' | 'missed';
  workoutId?: string;
  generatedAt?: string;
}

export interface AIStatus {
  name: string;
  status: 'connected' | 'unavailable' | 'model_not_found';
  lastChecked: string;
}
