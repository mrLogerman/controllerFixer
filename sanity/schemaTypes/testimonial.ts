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
      name: "rating",
      title: "Star rating",
      type: "number",
      validation: (rule: { min: (value: number) => { max: (value: number) => unknown } }) =>
        rule.min(1).max(5),
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      description: "Blank or approved reviews are public. Pending reviews stay off the site.",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
        ],
      },
    },
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
