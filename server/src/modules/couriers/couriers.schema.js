import { z } from 'zod';

// Zimbabwe licence codes (current system)
export const VEHICLE_TYPES = ['motorbike', 'car', 'van', 'truck'];
export const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'BE'];

export const upsertCourierProfileSchema = z.object({
  vehicle_type: z.enum(VEHICLE_TYPES),
  vehicle_make: z.string().min(2).max(60),
  vehicle_model: z.string().min(1).max(60),
  vehicle_color: z.string().min(2).max(40),
  vehicle_plate: z.string().min(3).max(20),
  vehicle_capacity_kg: z.number().positive().max(20000),
  license_class: z.enum(LICENSE_CLASSES),
  license_number: z.string().min(3).max(40),
  license_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  max_active_jobs: z.number().int().min(1).max(20).optional(),
});

export const availabilitySchema = z.object({
  is_available: z.boolean(),
});