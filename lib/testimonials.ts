export type Testimonial = {
  quote: string;
  name: string;
  repair: string;
  rating?: number;
  // Drop a file in /public/feedback and point here, e.g. "/feedback/marcus.jpg".
  image?: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "My Series X controller feels better than it did new. Zero drift and the turnaround was quick.",
    name: "Marcus T.",
    repair: "Xbox Hall Effect upgrade",
  },
  {
    quote:
      "Clear price, easy process, and my DualSense is finally accurate again. Exactly what I needed.",
    name: "Jenna R.",
    repair: "PS5 Hall Effect upgrade",
  },
  {
    quote:
      "I was about to buy another controller. The $30 upgrade saved it and fixed the problem completely.",
    name: "Chris D.",
    repair: "Xbox stick repair",
  },
  {
    quote:
      "Fast, friendly, and much cheaper than replacing my controller. The sticks feel smooth and precise again.",
    name: "Taylor M.",
    repair: "DualSense stick repair",
  },
  {
    quote:
      "The pickup option made everything easy. My Elite controller was fixed and back in my hands the same day.",
    name: "Devon K.",
    repair: "Xbox Elite repair",
  },
  {
    quote:
      "I play every night and the Hall Effect upgrade has been rock solid. No drift and no dead-zone problems.",
    name: "Sam P.",
    repair: "PS5 Hall Effect upgrade",
  },
];
