import z from "zod";

const userProfileWorkingMemoryTemplateString = `
# User Profile

## Personal info

- Name:
- Location:
- Timezone:

## Preferences

- Communication Style: [e.g., Formal, Casual]
- Project Goal:
- Key Deadlines:
  - [Deadline 1]: [Date]
  - [Deadline 2]: [Date]

## Session state

- Last Task Discussed:
- Open Questions:
  - [Question 1]
  - [Question 2]
`;

const userProfileWorkingMemorySchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      communicationStyle: z.string().optional(),
      projectGoal: z.string().optional(),
      deadlines: z.array(z.string()).optional(),
    })
    .optional(),
});

export {
  userProfileWorkingMemorySchema,
  userProfileWorkingMemoryTemplateString,
};
