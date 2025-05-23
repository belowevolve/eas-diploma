'use client'
import type { Address } from 'viem'
import type { FormSchema } from './model'
import { easOnchainUrl } from '@/entities/attestation/model/url'
import { Button } from '@/shared/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { Textarea } from '@/shared/ui/textarea'
import { tryCatch } from '@/shared/utils/try-catch'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { register } from './action'
import { formSchema } from './model'

export default function Page() {
  const { address } = useAppKitAccount()
  const { open } = useAppKit()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  async function onSubmit(values: FormSchema) {
    if (!address) {
      toast.error('Подключите кошелек')
      return
    }
    setIsPending(true)
    console.log(values)
    const result = await tryCatch(register(values, address as Address))
    if (result.error) {
      toast.error(result.error.message)
      console.log(result.error)
      setIsPending(false)
      return
    }
    toast.success('Аттестатор успешно зарегистрирован', {
      action: {
        label: 'Перейти к аттестату',
        onClick: () => {
          window.open(easOnchainUrl(result.data.newAttestationUID), '_blank')
        },
      },
    })
    setIsPending(false)
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
          {address
            ? <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Отправка...' : 'Отправить форму'}</Button>
            : <Button onClick={() => open()} className="w-full">Подключите кошелек</Button>}
        </form>
      </Form>
    </PageContainer>
  )
}
