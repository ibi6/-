import type {
  AuthUser,
  Exercise,
  ExerciseSet,
  FoodItem,
  FoodRecognitionResult,
  Meal,
  NutritionSummary,
  UserProfile,
  WorkoutAdjustmentRequest,
  WorkoutPlan,
  WorkoutSession,
  BodyMeasurement,
  AIContext,
  AIResponse,
} from '@/types';

export interface AuthApi {
  login(email: string, password: string): Promise<AuthUser>;
  register(email: string, password: string, name: string): Promise<AuthUser>;
  logout(): Promise<void>;
  getProfile(): Promise<UserProfile | null>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
}

export interface WorkoutApi {
  getWeeklyPlan(date: string): Promise<WorkoutPlan>;
  getExercise(id: string): Promise<Exercise>;
  listExercises(): Promise<Exercise[]>;
  startWorkout(planDayDate: string): Promise<WorkoutSession>;
  saveExerciseSet(sessionId: string, exerciseId: string, set: ExerciseSet): Promise<void>;
  completeWorkout(sessionId: string): Promise<WorkoutSession>;
  getSession(sessionId: string): Promise<WorkoutSession | null>;
  listSessions(): Promise<WorkoutSession[]>;
}

export interface NutritionApi {
  getDailySummary(date: string): Promise<NutritionSummary>;
  searchFoods(query: string): Promise<FoodItem[]>;
  getFood(id: string): Promise<FoodItem>;
  addMeal(meal: Meal): Promise<Meal>;
  updateMeal(meal: Meal): Promise<Meal>;
  deleteMeal(mealId: string): Promise<void>;
}

export interface HealthApi {
  listMeasurements(): Promise<BodyMeasurement[]>;
  addMeasurement(m: BodyMeasurement): Promise<BodyMeasurement>;
  deleteMeasurement(id: string): Promise<void>;
}

export interface AIApi {
  sendMessage(input: string, context: AIContext): Promise<AIResponse>;
  recognizeFood(imageUri: string): Promise<FoodRecognitionResult>;
  adjustWorkout(request: WorkoutAdjustmentRequest): Promise<WorkoutPlan>;
}

export interface FitAIApi {
  auth: AuthApi;
  workout: WorkoutApi;
  nutrition: NutritionApi;
  health: HealthApi;
  ai: AIApi;
}
