// A private invite for one customer. These documents are created as drafts so
// the public dataset cannot list customer names or feedback links.
export const feedbackRequest = {
  name: "feedbackRequest",
  title: "Feedback link",
  type: "document",
  fields: [
    {
      name: "token",
      title: "Token",
      type: "string",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "customerName",
      title: "Customer name",
      type: "string",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "controllerType",
      title: "Controller",
      type: "string",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "repair",
      title: "Repair performed",
      type: "string",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: "repairDate",
      title: "Repair date",
      type: "date",
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    { name: "message", title: "Personal note", type: "text", rows: 3 },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Submitted", value: "submitted" },
          { title: "Approved", value: "approved" },
          { title: "Disabled", value: "disabled" },
        ],
      },
    },
    { name: "issuedAt", title: "Issued", type: "datetime" },
    { name: "submittedAt", title: "Submitted", type: "datetime" },
    { name: "rating", title: "Star rating", type: "number" },
    { name: "quote", title: "Review", type: "text", rows: 4 },
    {
      name: "images",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    },
    { name: "testimonialId", title: "Published review id", type: "string" },
  ],
  preview: {
    select: { title: "customerName", subtitle: "status" },
  },
};
