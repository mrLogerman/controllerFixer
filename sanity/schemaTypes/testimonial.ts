const categories = [
  { title: "Traditional", value: "traditional" },
  { title: "Hall Effect", value: "hallEffect" },
  { title: "TMR", value: "tmr" },
];

// Customer feedback. The creation date is Sanity's built-in _createdAt.
export const testimonial = {
  name: "testimonial",
  title: "Customer feedback",
  type: "document",
  fields: [
    {
      name: "quote",
      title: "Feedback",
      type: "text",
      rows: 4,
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "name",
      title: "Customer name",
      type: "string",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    { name: "repair", title: "Repair", type: "string" },
    {
      name: "category",
      title: "Joystick type",
      type: "string",
      options: { list: categories, layout: "radio" },
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "images",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "images.0" },
  },
};
