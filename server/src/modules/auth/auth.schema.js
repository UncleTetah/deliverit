import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20).optional(),
  role: z.enum(['customer', 'courier']).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});