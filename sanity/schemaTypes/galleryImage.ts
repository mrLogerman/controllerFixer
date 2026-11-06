// A finished-repair photo for the "Controllers we've brought back" grid.
export const galleryImage = {
  name: "galleryImage",
  title: "Bench photo",
  type: "document",
  fields: [
    {
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
  ],
  preview: {
    select: { media: "image" },
  },
};
