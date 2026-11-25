import { z } from 'zod'

export const TodoSchema = z.object({
  id: z.guid(),
  title: z.string(),
  isDone: z.boolean(),
  createdAt: z.coerce.date(),
})

export type Todo = z.infer<typeof TodoSchema>

export const TodoPageSchema = z.object({
  items: z.array(TodoSchema),
  totalCount: z.number().int(),
})

export type TodoPage = z.infer<typeof TodoPageSchema>
