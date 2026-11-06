// Customer feedback, kept separate from the joystick types. The creation date
// is Sanity's built-in _createdAt.
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
      name: "images",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "repair", media: "images.0" },
  },
};
