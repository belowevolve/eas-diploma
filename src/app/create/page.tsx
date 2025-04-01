'use client'
import type { MerkleValue } from '@ethereum-attestation-service/eas-sdk'
import type { FormSchema } from './model'
import { env } from '@/env'
import { useSigner } from '@/shared/hooks/use-signer'
import { eas } from '@/shared/lib/eas'
import { Button } from '@/shared/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { Text } from '@/shared/ui/text'
import { NO_EXPIRATION, PrivateData, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { formSchema } from './model'

export default function Page() {
  const { address } = useAppKitAccount()
  const { open } = useAppKit()
  const signer = useSigner()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      degree: '',
      fio: '',
      faculty: '',
      program: '',
      diploma_theme: '',
      date: undefined,
      to: '',
    },
  })

  async function onSubmit(values: FormSchema) {
    if (!address || !signer) {
      toast.error('Подключите кошелек')
      return
    }
    eas.connect(signer)
    const merkle: MerkleValue[] = [
      { type: 'string', name: 'degree', value: values.degree },
      { type: 'string', name: 'fio', value: values.fio },
      { type: 'string', name: 'faculty', value: values.faculty },
      { type: 'string', name: 'program', value: values.program },
      { type: 'string', name: 'diploma_theme', value: values.diploma_theme },
      { type: 'uint256', name: 'date', value: values.date },
    ]
    const privateData = new PrivateData(merkle)
    const fullTree = privateData.getFullTree()
    const schemaEncoder = new SchemaEncoder('bytes32 privateData')
    const encodedData = schemaEncoder.encodeData([{ name: 'privateData', value: fullTree.root, type: 'bytes32' }])
    console.log(encodedData)
    const transaction = await eas.attest({
      schema: env.NEXT_PUBLIC_DIPLOMA_SCHEMA_UID,
      data: {
        recipient: values.to,
        expirationTime: NO_EXPIRATION,
        revocable: true,
        data: encodedData,
      },
    })

    const newAttestationUID = await transaction.wait()

    console.log('New attestation UID:', newAttestationUID)

    // Generate a multi-proof to selectively reveal some data
    const proofIndexes = [0, 2] // Revealing only name and isStudent
    const multiProof = privateData.generateMultiProof(proofIndexes)

    console.log('Multi-proof for selective reveal:', multiProof)
    console.log(values)
  }
  return (
    <PageContainer>
      <Text variant="h2">Создание аттестата</Text>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-96 space-y-4">
          <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Уровень образования</FormLabel>
                <FormControl>
                  <Input placeholder="Магистр" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Фамилия Имя Отчество</FormLabel>
                <FormControl>
                  <Input placeholder="Фамилия Имя Отчество" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="faculty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Факультет</FormLabel>
                <FormControl>
                  <Input placeholder="Факультет" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="program"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Образовательная программа</FormLabel>
                <FormControl>
                  <Input placeholder="Образовательная программа" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diploma_theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тема выпускной работы</FormLabel>
                <FormControl>
                  <Input placeholder="Тема выпускной работы" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={() => (
              <FormItem>
                <FormLabel>Дата выдачи</FormLabel>
                <FormControl>
                  <Input placeholder="2025" {...form.register('date', { valueAsNumber: true })} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Адрес получателя</FormLabel>
                <FormControl>
                  <Input placeholder="0x..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {address
            ? <Button type="submit" className="w-full">Отправить форму</Button>
            : <Button onClick={() => open()} className="w-full">Подключите кошелек</Button>}
        </form>
      </Form>
    </PageContainer>
  )
}
