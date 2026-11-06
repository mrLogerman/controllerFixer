const categories = [
  { title: "Traditional", value: "traditional" },
  { title: "Hall Effect", value: "hallEffect" },
  { title: "TMR", value: "tmr" },
];

// A video link for one joystick type. The creation date is _createdAt.
export const joystickVideo = {
  name: "joystickVideo",
  title: "Joystick video",
  type: "document",
  fields: [
    {
      name: "url",
      title: "Video URL",
      type: "url",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    { name: "title", title: "Title", type: "string" },
    {
      name: "category",
      title: "Joystick type",
      type: "string",
      options: { list: categories, layout: "radio" },
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category" },
  },
};
