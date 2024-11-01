'use client'
import type { FormSchema } from './modal'
import { Button } from '@/shared/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { register } from './action'
import { formSchema } from './modal'

export default function Page() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  async function onSubmit(values: FormSchema) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    const result = await register(values)
    if (result.errors) {
      toast.error(JSON.stringify(result.errors))
      console.log(result.errors)
    }
  }
  return (
    <PageContainer>
      <Text variant="h2">Регистрация аттестатора</Text>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-96 space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название учебного заведения</FormLabel>
                <FormControl>
                  <Input placeholder="СПб ГУАП" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дополнительные сведения</FormLabel>
                <FormControl>
                  <Textarea placeholder="Описание учебного заведения" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Отправить форму</Button>
        </form>
      </Form>
    </PageContainer>
  )
}
