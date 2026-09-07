import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Database file paths
const DB_DIR = path.join(process.cwd(), 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const PROFILES_FILE = path.join(DB_DIR, 'profiles.json');
const WORKOUTS_FILE = path.join(DB_DIR, 'workouts.json');
const SCHEDULES_FILE = path.join(DB_DIR, 'schedules.json');

// Initialize DB
function initDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  if (!fs.existsSync(PROFILES_FILE)) fs.writeFileSync(PROFILES_FILE, JSON.stringify([]));
  if (!fs.existsSync(WORKOUTS_FILE)) fs.writeFileSync(WORKOUTS_FILE, JSON.stringify([]));
  if (!fs.existsSync(SCHEDULES_FILE)) fs.writeFileSync(SCHEDULES_FILE, JSON.stringify([]));
}

function readJSON(file: string) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Exercise catalog
const EXERCISE_CATALOG = [
  { id: 'EX001', name: 'Bodyweight Squat', sets: 3, reps: 12, rest: 60, equipment: 'bodyweight', muscles: ['quads', 'glutes'] },
  { id: 'EX002', name: 'Glute Bridge', sets: 3, reps: 15, rest: 45, equipment: 'bodyweight', muscles: ['glutes', 'hamstrings'] },
  { id: 'EX003', name: 'Reverse Lunge', sets: 3, reps: 10, rest: 60, equipment: 'bodyweight', muscles: ['quads', 'glutes'] },
  { id: 'EX004', name: 'Forearm Plank', sets: 3, reps: 1, rest: 45, equipment: 'bodyweight', muscles: ['core'] },
  { id: 'EX005', name: 'Dumbbell Bent-Over Row', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', muscles: ['back', 'biceps'] },
  { id: 'EX006', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', muscles: ['shoulders', 'triceps'] },
  { id: 'EX007', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', muscles: ['hamstrings', 'back'] },
  { id: 'EX008', name: 'Incline Push-Up', sets: 3, reps: 12, rest: 60, equipment: 'bodyweight', muscles: ['chest', 'triceps'] },
  { id: 'EX009', name: 'Jumping Jack', sets: 3, reps: 20, rest: 30, equipment: 'bodyweight', muscles: ['full_body', 'cardio'] },
  { id: 'EX010', name: 'Resistance Band Row', sets: 3, reps: 12, rest: 45, equipment: 'resistance_band', muscles: ['back', 'biceps'] },
  { id: 'EX011', name: 'Resistance Band Curl', sets: 3, reps: 12, rest: 45, equipment: 'resistance_band', muscles: ['biceps'] },
  { id: 'EX012', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, rest: 45, equipment: 'dumbbell', muscles: ['biceps'] },
];

interface Workout {
  id: string;
  userId: string;
  title: string;
  durationMinutes: number;
  exercises: Exercise[];
  difficulty: number;
  createdAt: string;
  completedAt?: string;
}

interface WorkoutSchedule {
  id: string;
  userId: string;
  dayNumber: number;
  scheduledDate: string;
  status: 'pending' | 'ready' | 'active' | 'completed' | 'missed';
  workoutId?: string;
  generatedAt?: string;
}

interface RPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  timestamp: string;
}

// Database (file-based for development)
const DB_DIR = path.join(process.cwd(), 'db');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const getDB = (collection: string) => {
  const file = path.join(DB_DIR, `${collection}.json`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
};

const saveDB = (collection: string, data: any[]) => {
  const file = path.join(DB_DIR, `${collection}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Exercise Catalog (Internal)
const EXERCISE_CATALOG: Record<string, any> = {
  EX001: {
    exerciseId: 'EX001',
    name: 'Bodyweight Squat',
    description: 'Lower body compound movement',
    movementPattern: 'squat',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    suitableGoals: ['strength', 'endurance', 'weight_loss'],
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 60,
    techniqueCues: ['Keep chest up', 'Lower hips back', 'Full depth'],
  },
  EX002: {
    exerciseId: 'EX002',
    name: 'Glute Bridge',
    description: 'Hip extension movement',
    movementPattern: 'bridge',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    suitableGoals: ['strength', 'muscle_gain'],
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 45,
  },
  EX003: {
    exerciseId: 'EX003',
    name: 'Reverse Lunge',
    description: 'Single-leg lower body movement',
    movementPattern: 'lunge',
    equipment: 'bodyweight',
    difficulty: 2,
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    suitableGoals: ['strength', 'balance'],
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 60,
  },
  EX004: {
    exerciseId: 'EX004',
    name: 'Forearm Plank',
    description: 'Core stability exercise',
    movementPattern: 'plank',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    suitableGoals: ['strength', 'endurance'],
    defaultSets: 3,
    defaultReps: 1,
    restSeconds: 45,
  },
  EX005: {
    exerciseId: 'EX005',
    name: 'Dumbbell Bent-Over Row',
    description: 'Upper back pulling movement',
    movementPattern: 'row',
    equipment: 'dumbbell',
    difficulty: 2,
    primaryMuscles: ['back', 'lats'],
    secondaryMuscles: ['biceps'],
    suitableGoals: ['strength', 'muscle_gain'],
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 60,
  },
  EX006: {
    exerciseId: 'EX006',
    name: 'Dumbbell Shoulder Press',
    description: 'Overhead pressing movement',
    movementPattern: 'press',
    equipment: 'dumbbell',
    difficulty: 2,
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'chest'],
    suitableGoals: ['strength', 'muscle_gain'],
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 60,
  },
  EX007: {
    exerciseId: 'EX007',
    name: 'Dumbbell Romanian Deadlift',
    description: 'Hip hinge movement',
    movementPattern: 'deadlift',
    equipment: 'dumbbell',
    difficulty: 2,
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back'],
    suitableGoals: ['strength', 'endurance'],
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 60,
  },
  EX008: {
    exerciseId: 'EX008',
    name: 'Incline Push-Up',
    description: 'Modified pushing movement',
    movementPattern: 'pushup',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    suitableGoals: ['strength', 'muscle_gain'],
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 60,
  },
  EX009: {
    exerciseId: 'EX009',
    name: 'Jumping Jack',
    description: 'Full-body cardio movement',
    movementPattern: 'jump',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['legs', 'shoulders'],
    suitableGoals: ['endurance', 'weight_loss'],
    defaultSets: 3,
    defaultReps: 20,
    restSeconds: 45,
  },
  EX010: {
    exerciseId: 'EX010',
    name: 'Standing Hamstring Stretch',
    description: 'Flexibility movement',
    movementPattern: 'stretch',
    equipment: 'bodyweight',
    difficulty: 1,
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    suitableGoals: ['flexibility'],
    defaultSets: 2,
    defaultReps: 1,
    restSeconds: 30,
  },
  EX011: {
    exerciseId: 'EX011',
    name: 'Resistance Band Row',
    description: 'Band pulling movement',
    movementPattern: 'row',
    equipment: 'resistance_band',
    difficulty: 1,
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    suitableGoals: ['strength'],
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 45,
  },
  EX012: {
    exerciseId: 'EX012',
    name: 'Resistance Band Curl',
    description: 'Band arm curl',
    movementPattern: 'curl',
    equipment: 'resistance_band',
    difficulty: 1,
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    suitableGoals: ['muscle_gain'],
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 45,
  },
  EX013: {
    exerciseId: 'EX013',
    name: 'Resistance Band Shoulder Press',
    description: 'Band overhead press',
    movementPattern: 'press',
    equipment: 'resistance_band',
    difficulty: 1,
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    suitableGoals: ['strength'],
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 45,
  },
};

// AI Provider
interface AIProvider {
  name: string;
  status: 'connected' | 'unavailable' | 'model_not_found';
  lastChecked: string;
}

let aiProviderStatus: AIProvider = {
  name: 'qwen',
  status: 'unavailable',
  lastChecked: new Date().toISOString(),
};

const checkAIStatus = async () => {
  try {
    const ollamaUrl = process.env.AI_OLLAMA_URL || 'http://localhost:11434';
    const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 2000 });
    const models = response.data.models || [];
    const hasQwen = models.some((m: any) => m.name.includes('qwen'));
    aiProviderStatus = {
      name: 'qwen',
      status: hasQwen ? 'connected' : 'model_not_found',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    aiProviderStatus = {
      name: 'qwen',
      status: 'unavailable',
      lastChecked: new Date().toISOString(),
    };
  }
};

// Check AI status on startup
checkAIStatus();

// Generate workout using Qwen
const generateWorkoutWithQwen = async (profile: UserProfile): Promise<Workout | null> => {
  try {
    const ollamaUrl = process.env.AI_OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.AI_QWEN_MODEL || 'qwen3:4b';

    const equipmentList = profile.equipment.join(', ');
    const limitationsList = profile.limitations.join(', ') || 'none';

    const prompt = `Generate a personalized workout plan in JSON format ONLY. No markdown, no explanations.

User Profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Fitness Level: ${profile.fitnessLevel}
- Goal: ${profile.fitnessGoal}
- Available Equipment: ${equipmentList}
- Limitations: ${limitationsList}
- Preferences: ${profile.preferences}
- Current RP: ${profile.currentRP}
- Current Rank: ${profile.currentRank}

Return ONLY valid JSON with this exact structure:
{
  "title": "Workout title",
  "durationMinutes": 30,
  "exercises": [
    {
      "exerciseId": "EX001",
      "sets": 3,
      "reps": 12,
      "restSeconds": 60
    }
  ]
}

Available exercises: EX001, EX002, EX003, EX004, EX005, EX006, EX007, EX008, EX009, EX010, EX011, EX012, EX013

IMPORTANT: Only use exercise IDs from the list above. Return ONLY JSON, nothing else.`;

    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        think: false,
      },
      { timeout: 30000 }
    );

    const content = response.data.response || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return null;
    }

    const workoutData = JSON.parse(jsonMatch[0]);

    // Validate and build workout
    const exercises: Exercise[] = workoutData.exercises
      .filter((ex: any) => EXERCISE_CATALOG[ex.exerciseId])
      .map((ex: any) => {
        const catalog = EXERCISE_CATALOG[ex.exerciseId];
        return {
          exerciseId: ex.exerciseId,
          name: catalog.name,
          sets: ex.sets || catalog.defaultSets,
          reps: ex.reps || catalog.defaultReps,
          restSeconds: ex.restSeconds || catalog.restSeconds,
          targetMuscles: catalog.primaryMuscles,
          equipment: catalog.equipment,
          difficulty: catalog.difficulty,
        };
      });

    if (exercises.length === 0) {
      return null;
    }

    const workout: Workout = {
      id: uuidv4(),
      userId: profile.userId,
      title: workoutData.title || 'Personalized Workout',
      durationMinutes: workoutData.durationMinutes || 30,
      exercises,
      difficulty: 2,
      createdAt: new Date().toISOString(),
    };

    return workout;
  } catch (error) {
    console.error('Qwen generation error:', error);
    return null;
  }
};

// Routes

// AI Status
app.get('/api/v1/ai/status', (req, res) => {
  res.json(aiProviderStatus);
});

// Auth
app.post('/api/v1/auth/register', (req, res) => {
  const { email, username, password } = req.body;
  const users = getDB('users');

  if (users.find((u: User) => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const user: User = {
    id: uuidv4(),
    email,
    username,
    passwordHash: Buffer.from(password).toString('base64'), // Simple hash for demo
  };

  users.push(user);
  saveDB('users', users);

  res.json({ id: user.id, email: user.email, username: user.username });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = getDB('users');
  const user = users.find((u: User) => u.email === email);

  if (!user || user.passwordHash !== Buffer.from(password).toString('base64')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ id: user.id, email: user.email, username: user.username });
});

// Profile
app.get('/api/v1/profile/:userId', (req, res) => {
  const profiles = getDB('profiles');
  const profile = profiles.find((p: UserProfile) => p.userId === req.params.userId);
  res.json(profile || null);
});

app.post('/api/v1/profile', (req, res) => {
  const { userId, ...profileData } = req.body;
  const profiles = getDB('profiles');
  const existing = profiles.findIndex((p: UserProfile) => p.userId === userId);

  const profile: UserProfile = {
    userId,
    ...profileData,
    currentRP: profileData.currentRP || 0,
    currentRank: profileData.currentRank || 'IRON',
  };

  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }

  saveDB('profiles', profiles);
  res.json(profile);
});

// Workout Generation
app.post('/api/v1/workouts/generate', async (req, res) => {
  const { userId } = req.body;
  const profiles = getDB('profiles');
  const profile = profiles.find((p: UserProfile) => p.userId === userId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (aiProviderStatus.status !== 'connected') {
    return res.status(503).json({ error: 'AI provider unavailable' });
  }

  const workout = await generateWorkoutWithQwen(profile);

  if (!workout) {
    return res.status(500).json({ error: 'Failed to generate workout' });
  }

  const workouts = getDB('workouts');
  workouts.push(workout);
  saveDB('workouts', workouts);

  // Create 7-day schedule
  const schedules = getDB('schedules');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const schedule: WorkoutSchedule = {
      id: uuidv4(),
      userId,
      dayNumber: i + 1,
      scheduledDate: date.toISOString().split('T')[0],
      status: i === 0 ? 'ready' : 'pending',
      workoutId: i === 0 ? workout.id : undefined,
      generatedAt: i === 0 ? new Date().toISOString() : undefined,
    };

    schedules.push(schedule);
  }

  saveDB('schedules', schedules);

  res.json({
    workout,
    schedule: schedules.filter((s: WorkoutSchedule) => s.userId === userId),
  });
});

// Get today's workout
app.get('/api/v1/workouts/today/:userId', (req, res) => {
  const schedules = getDB('schedules');
  const workouts = getDB('workouts');

  const today = new Date().toISOString().split('T')[0];
  const schedule = schedules.find(
    (s: WorkoutSchedule) => s.userId === req.params.userId && s.scheduledDate === today
  );

  if (!schedule || !schedule.workoutId) {
    return res.json(null);
  }

  const workout = workouts.find((w: Workout) => w.id === schedule.workoutId);
  res.json(workout || null);
});

// Get 7-day schedule
app.get('/api/v1/workouts/schedule/:userId', (req, res) => {
  const schedules = getDB('schedules');
  const userSchedules = schedules.filter((s: WorkoutSchedule) => s.userId === req.params.userId);
  res.json(userSchedules);
});

// Get workout details
app.get('/api/v1/workouts/:workoutId', (req, res) => {
  const workouts = getDB('workouts');
  const workout = workouts.find((w: Workout) => w.id === req.params.workoutId);
  res.json(workout || null);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ai: aiProviderStatus });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FitX Server running on port ${PORT}`);
  console.log(`AI Provider: ${aiProviderStatus.name} - ${aiProviderStatus.status}`);
});
