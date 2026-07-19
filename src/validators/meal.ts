import { z } from 'zod';

export const addFoodSchema = z.object({
  foodId: z.string().min(1),
  weightG: z.coerce.number().min(1, '克重至少 1g').max(5000, '克重过大'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export type AddFoodForm = z.infer<typeof addFoodSchema>;
