/** Core domain types for FitAI V1 */

export type Goal = 'lose_fat' | 'build_muscle' | 'keep_fit' | 'improve_endurance';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'dumbbells' | 'full_gym' | 'home_basic';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_say';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full_body'
  | 'cardio';
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_yearly';
export type WorkoutPhase =
  | 'idle'
  | 'preparing'
  | 'activeSet'
  | 'resting'
  | 'completed'
  | 'summary';
export type AICategory = 'general' | 'nutrition' | 'workout' | 'safety';
export type Rpe = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUri?: string;
  gender: Gender;
  birthYear?: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  experience: ExperienceLevel;
  equipment: Equipment;
  trainingDaysPerWeek: number;
  dietPreference?: string;
  injuries?: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  token: string;
};

export type Exercise = {
  id: string;
  name: string;
  nameEn?: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment | 'barbell' | 'cable' | 'machine' | 'bodyweight' | 'dumbbell';
  difficulty: Difficulty;
  description: string;
  cues: string[];
  commonMistakes: string[];
  defaultSets: number;
  defaultReps: number;
  defaultRestSec: number;
  isCompound: boolean;
};

export type PlannedExercise = {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
  targetWeightKg?: number;
  notes?: string;
};

export type PlanDay = {
  date: string;
  title: string;
  focus: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  isRestDay: boolean;
  exercises: PlannedExercise[];
};

export type WorkoutPlan = {
  id: string;
  weekStart: string;
  days: PlanDay[];
};

export type ExerciseSet = {
  id: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  rpe?: Rpe;
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
};

export type SessionExercise = {
  exerciseId: string;
  name: string;
  plannedSets: number;
  plannedReps: number;
  restSec: number;
  sets: ExerciseSet[];
  notes?: string;
  painReported?: boolean;
};

export type WorkoutSession = {
  id: string;
  planDayDate: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  phase: WorkoutPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: SessionExercise[];
  restEndsAt?: string;
  totalVolumeKg?: number;
  durationSec?: number;
};

export type FoodItem = {
  id: string;
  name: string;
  brand?: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  commonServingG: number;
  tags?: string[];
  barcode?: string;
};

export type MealFood = {
  id: string;
  foodId: string;
  name: string;
  weightG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = {
  id: string;
  date: string;
  mealType: MealType;
  foods: MealFood[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionSummary = {
  date: string;
  consumed: NutritionTargets;
  targets: NutritionTargets;
  remaining: NutritionTargets;
  meals: Meal[];
  progress: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type BodyMeasurement = {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
  thighCm?: number;
  note?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
  category?: AICategory;
  cards?: AIRecommendationCardData[];
  actions?: AIAction[];
  disclaimer?: string;
};

export type AIRecommendationCardData = {
  id: string;
  type: 'meal' | 'workout' | 'tip' | 'warning';
  title: string;
  subtitle?: string;
  body: string;
  metrics?: { label: string; value: string }[];
  primaryActionLabel?: string;
  primaryActionId?: string;
};

export type AIAction = {
  id: string;
  label: string;
  type: 'navigate' | 'apply_plan' | 'add_food' | 'start_workout' | 'dismiss';
  payload?: Record<string, unknown>;
};

export type AIContext = {
  userProfile: UserProfile;
  todayWorkout?: WorkoutSession;
  nutritionSummary: NutritionSummary;
  recentMeasurements: BodyMeasurement[];
};

export type AIResponse = {
  id: string;
  text: string;
  category: AICategory;
  cards?: AIRecommendationCardData[];
  actions?: AIAction[];
  disclaimer?: string;
};

export type FoodRecognitionResult = {
  candidates: Array<{
    foodId: string;
    name: string;
    confidence: number;
    suggestedWeightG: number;
  }>;
  imageUri: string;
};

export type WorkoutAdjustmentRequest = {
  reason: string;
  painArea?: string;
  preferredDurationMin?: number;
};

export type AppSettings = {
  units: 'metric' | 'imperial';
  restTimerSound: boolean;
  haptics: boolean;
  language: 'zh' | 'en';
  notifications: boolean;
  darkMode: boolean;
};

export type SubscriptionState = {
  plan: SubscriptionPlan;
  expiresAt?: string;
  isActive: boolean;
  trialUsed: boolean;
};

export type AppError = {
  code: 'NETWORK' | 'TIMEOUT' | 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  details?: unknown;
};

export type WeeklyStats = {
  workoutsCompleted: number;
  totalMinutes: number;
  totalVolumeKg: number;
  avgCalories: number;
  weightChangeKg: number;
};
