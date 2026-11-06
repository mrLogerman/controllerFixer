import { z } from "zod";

export const repairRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(160),
  phone: z.string().trim().max(30).optional(),
  controller: z.enum([
    "Xbox Series X|S",
    "Xbox One",
    "Xbox Elite",
    "PS5 DualSense",
    "PS5 DualSense Edge",
  ]),
  service: z.enum([
    "Hall Effect joystick",
    "TMR joystick",
    "Buttons",
    "Triggers / bumpers",
    "USB-C / charging",
    "Not sure",
  ]),
  fulfillment: z.enum([
    "Drop off",
    "Pickup & drop-off",
  ]),
  details: z.string().trim().min(10, "Tell us a little more").max(1200),
  turnstileToken: z.string().optional(),
});

export type RepairRequest = z.infer<typeof repairRequestSchema>;
