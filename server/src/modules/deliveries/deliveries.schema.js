import { z } from 'zod';

export const DELIVERY_CATEGORIES = ['document', 'parcel', 'bulk', 'freight'];

export const createDeliverySchema = z.object({
  pickup_address: z.string().min(3).max(500),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  pickup_contact: z.string().max(120).optional(),

  dropoff_address: z.string().min(3).max(500),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
  dropoff_contact: z.string().max(120).optional(),

  category: z.enum(DELIVERY_CATEGORIES).default('parcel'),
  package_desc: z.string().max(1000).optional(),
  package_weight_kg: z.number().positive().max(20000),

  notes: z.string().max(1000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed',
  ]),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  note: z.string().max(500).optional(),
});