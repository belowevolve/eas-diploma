import { z } from 'zod'

export const formSchema = z.object({
  name: z.string().min(1, { message: 'Необходимо указать название' }).max(30, {
    message: 'Не больше 30 символов',
  }),
  description: z.string().max(300, {
    message: 'Не больше 300 символов',
  }),
})

export type FormSchema = z.infer<typeof formSchema>
