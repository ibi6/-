import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().min(1, '请输入昵称'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_say']),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  goal: z.enum(['lose_fat', 'build_muscle', 'keep_fit', 'improve_endurance']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.enum(['none', 'dumbbells', 'full_gym', 'home_basic']),
  trainingDaysPerWeek: z.coerce.number().min(1).max(7),
});

export type OnboardingForm = z.infer<typeof onboardingSchema>;
