import { z } from 'zod'

export const formSchema = z.object({

  fio: z.string()
    .regex(/^[А-ЯЁA-Z][а-яёa-z]+ [А-ЯЁA-Z][а-яёa-z]+( [А-ЯЁA-Z][а-яёa-z]+)?$/, {
      message: 'По формату Фамилия Имя Отчество',
    })
    .max(60, {
      message: 'Не больше 60 символов',
    }),
  degree: z.string().min(1, {
    message: 'Необходимо указать уровень образования',
  }).max(30, {
    message: 'Не больше 30 символов',
  }),
  faculty: z.string().min(1, {
    message: 'Необходимо указать факультет',
  }).max(30, {
    message: 'Не больше 30 символов',
  }),
  program: z.string().min(1, {
    message: 'Необходимо указать образовательную программу',
  }).max(30, {
    message: 'Не больше 30 символов',
  }),
  diploma_theme: z.string().min(1, {
    message: 'Необходимо указать тему выпускной работы',
  }).max(100, {
    message: 'Не больше 100 символов',
  }),
  date: z.coerce.number({ message: 'Должно быть число' }).min(1900, {
    message: 'Год должен быть больше 1900',
  }).max(4294967295, {
    message: 'Не больше 4294967295',
  }),
  to: z.string().min(1, {
    message: 'Необходимо указать адрес получателя',
  }).startsWith('0x', {
    message: 'Необходимо указать адрес получателя',
  }),
})

export type FormSchema = z.infer<typeof formSchema>
