
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { UserProfile, Workout, WorkoutSchedule, AIStatus } from '@/types/fitx';
import { Zap, Loader, AlertCircle, CheckCircle, Calendar, Dumbbell, Clock, Flame } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const [page, setPage] = useState<'auth' | 'onboarding' | 'dashboard'>('auth');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Auth form
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Profile form
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 75,
    fitnessLevel: 'beginner',
    fitnessGoal: 'general_fitness',
    equipment: ['bodyweight'],
    limitations: [],
    preferences: '',
    region: 'Northern Zone',
    currentRP: 0,
    currentRank: 'IRON',
  });

  // Dashboard
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [schedule, setSchedule] = useState<WorkoutSchedule[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Check page on mount and user change
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPage('auth');
      return;
    }

    const checkProfile = async () => {
      try {
        const p = await api.getProfile(user.id);
        if (p) {
          setSavedProfile(p);
          setPage('dashboard');
          loadDashboard(user.id);
        } else {
          setPage('onboarding');
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        setPage('onboarding');
      } finally {
        setDashboardLoading(false);
      }
    };

    checkProfile();
  }, [user, authLoading]);

  const loadDashboard = async (userId: string) => {
    try {
      const [aiSt, todayWk, sched] = await Promise.all([
        api.getAIStatus(),
        api.getTodayWorkout(userId),
        api.getSchedule(userId),
      ]);
      setAiStatus(aiSt);
      setTodayWorkout(todayWk);
      setSchedule(sched);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const fullProfile: UserProfile = {
        userId: user.id,
        ...(profile as UserProfile),
      };

      await api.saveProfile(fullProfile);
      setSavedProfile(fullProfile);
      setPage('dashboard');
      loadDashboard(user.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleGenerateWorkout = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const result = await api.generateWorkout(user.id);
      setTodayWorkout(result.workout);
      setSchedule(result.schedule);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to generate workout');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auth Page
  if (page === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-4">
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">FitX</h1>
            <p className="text-slate-400">AI-Powered Personalized Fitness</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {isAuthLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {isLogin ? 'Login' : 'Register'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              className="w-full text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Email: demo@fitx.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding Page
  if (page === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-slate-400">Help us personalize your fitness journey</p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur">
            {/* Personal */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="col-span-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <input
                  type="number"
                  placeholder="Age"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="number"
                  placeholder="Height (cm)"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Fitness */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Fitness Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={profile.fitnessLevel}
                  onChange={(e) => setProfile({ ...profile, fitnessLevel: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={profile.fitnessGoal}
                  onChange={(e) => setProfile({ ...profile, fitnessGoal: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="strength">Strength</option>
                  <option value="endurance">Endurance</option>
                  <option value="general_fitness">General Fitness</option>
                </select>

                <select
                  value={profile.region}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  className="col-span-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Northern Zone">Northern Zone</option>
                  <option value="Southern Zone">Southern Zone</option>
                  <option value="Eastern Zone">Eastern Zone</option>
                  <option value="Western Zone">Western Zone</option>
                </select>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Available Equipment</h2>
              <div className="grid grid-cols-2 gap-3">
                {['bodyweight', 'dumbbell', 'resistance_band', 'pull_up_bar'].map((eq) => (
                  <label key={eq} className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500/50">
                    <input
                      type="checkbox"
                      checked={profile.equipment?.includes(eq) || false}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...(profile.equipment || []), eq]
                          : profile.equipment?.filter((e) => e !== eq) || [];
                        setProfile({ ...profile, equipment: updated });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-white capitalize">{eq.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-white font-semibold mb-2">Preferences / Notes</label>
              <textarea
                placeholder="E.g., focus on legs, avoid jumping, keep workouts short..."
                value={profile.preferences}
                onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-24"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Page
  if (page === 'dashboard') {
    if (dashboardLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Navbar */}
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold text-white">FitX</span>
            </div>

            <div className="flex items-center gap-4">
              {aiStatus && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs">
                  {aiStatus.status === 'connected' ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-green-400">AI Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">AI {aiStatus.status}</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={logout}
                className="px-4 py-2 text-slate-400 hover:text-white transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {savedProfile?.name}! 💪
            </h1>
            <p className="text-slate-400">
              {savedProfile?.currentRank} • {savedProfile?.currentRP} RP
            </p>
          </div>

          {/* AI Generation Section */}
          <div className="mb-12 bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-slate-900/50 border border-cyan-500/30 rounded-2xl p-8 backdrop-blur">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Workout Generation</h2>
                <p className="text-slate-400">
                  {todayWorkout
                    ? 'Your personalized workout is ready'
                    : 'Generate your personalized workout powered by Qwen AI'}
                </p>
              </div>
              {aiStatus?.status === 'connected' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 text-sm font-semibold">Qwen Ready</span>
                </div>
              )}
            </div>

            {todayWorkout ? (
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{todayWorkout.title}</h3>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <span>{todayWorkout.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Dumbbell className="w-5 h-5 text-cyan-400" />
                      <span>{todayWorkout.exercises.length} exercises</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Flame className="w-5 h-5 text-cyan-400" />
                      <span>
                        {todayWorkout.exercises.reduce((acc, ex) => acc + ex.sets * ex.reps, 0)} total reps
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {todayWorkout.exercises.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="text-white font-semibold">{ex.name}</p>
                          <p className="text-slate-400 text-sm">
                            {ex.sets}×{ex.reps} • {ex.equipment}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Rest: {ex.restSeconds}s</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateWorkout}
                  disabled={isGenerating}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Generate New Workout
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateWorkout}
                disabled={isGenerating || aiStatus?.status !== 'connected'}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-3 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating with Qwen AI...
                  </>
                ) : aiStatus?.status !== 'connected' ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    AI Provider Unavailable
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate AI Workout
                  </>
                )}
              </button>
            )}
          </div>

          {/* 7-Day Schedule */}
          {schedule.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur">
              <h2 className="text-2xl font-bold text-white mb-6">7-Day Plan</h2>

              <div className="grid grid-cols-7 gap-3">
                {schedule.map((day) => (
                  <div
                    key={day.id}
                    className={`p-4 rounded-lg text-center transition ${
                      day.status === 'ready'
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : day.status === 'completed'
                          ? 'bg-green-500/20 border border-green-500/50'
                          : day.status === 'missed'
                            ? 'bg-red-500/20 border border-red-500/50'
                            : 'bg-slate-800/50 border border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-400 mb-2">Day {day.dayNumber}</div>
                    <div className="text-sm font-bold text-white mb-2">{new Date(day.scheduledDate).getDate()}</div>
                    <div className="flex items-center justify-center">
                      {day.status === 'ready' && <Zap className="w-4 h-4 text-cyan-400" />}
                      {day.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {day.status === 'missed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      {day.status === 'pending' && <Calendar className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 backdrop-blur mt-16 py-6 text-center text-slate-500 text-sm">
          <p>FitX • AI-Powered Personalized Fitness & Workout Platform</p>
        </footer>
      </div>
    );
  }
};

export default Index;
