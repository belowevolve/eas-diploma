'use server'
import { redirect } from 'next/navigation'
import { formSchema, type FormSchema } from './modal'

export async function register(data: FormSchema) {
  const parsed = formSchema.safeParse(data)
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  redirect('/')
}
