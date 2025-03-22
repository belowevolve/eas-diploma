import type { AttestationShareablePackageObject, FullMerkleDataTree, MerkleMultiProof } from '@ethereum-attestation-service/eas-sdk'
import { decodeUriFragment } from '@/shared/utils/uri-fragment'
import { decodeBase64ZippedBase64 } from '@ethereum-attestation-service/eas-sdk'
import { useEffect, useState } from 'react'

export interface AttestationData {
  sig: {
    domain: {
      name: string
      version: string
      chainId: bigint | number
      verifyingContract: string
    }
    primaryType: string
    types: Record<string, any>
    message: {
      schema: string
      recipient: string
      time: number
      expirationTime: number
      revocable: boolean
      refUID: string
      data: string
      nonce: number
    }
    uid: string
    signature: string
  }
  signer: string
}

export const FRAGMENTS = {
  attestation: 'attestation=',
  proofs: 'proofs=',
  merkle: 'merkle=',
  refAttestation: 'refAttestation=',
} as const

export type FragmentType = keyof typeof FRAGMENTS

export interface FragmentsData {
  attestation: AttestationShareablePackageObject | null
  proofs: MerkleMultiProof | null
  merkle: FullMerkleDataTree | null
  refAttestation: AttestationShareablePackageObject | null
}

export interface UseFragmentsDecoderResult {
  fragments: FragmentsData
  loading: boolean
  error: string | null
}

/**
 * Хук для декодирования всех фрагментов из URL
 * @returns объект со всеми найденными фрагментами, состоянием загрузки и ошибкой
 */
export function useFragmentsDecoder(): UseFragmentsDecoderResult {
  const [fragments, setFragments] = useState<FragmentsData>({
    attestation: null,
    proofs: null,
    merkle: null,
    refAttestation: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const newFragments = { ...fragments }
    let foundAny = false
    let errorMessage: string | null = null

    try {
      // Получаем фрагмент URL
      const uriFragment = window.location.hash

      // Обрабатываем каждый тип фрагмента
      Object.entries(FRAGMENTS).forEach(([type, key]) => {
        const fragmentType = type as FragmentType

        try {
          if (!uriFragment.includes(key)) {
            return // Пропускаем, если фрагмент не найден
          }

          foundAny = true

          // Извлекаем параметр из фрагмента
          const parts = uriFragment.split(key)
          if (parts.length < 2) {
            throw new Error(`Некорректный формат URL с ${fragmentType}`)
          }

          // Берем часть после key и до следующего & или конца строки
          let paramValue = parts[1]
          const nextParamIndex = paramValue.indexOf('&')
          if (nextParamIndex !== -1) {
            paramValue = paramValue.substring(0, nextParamIndex)
          }

          // Декодируем параметр
          paramValue = decodeURIComponent(paramValue)

          switch (fragmentType) {
            case 'attestation':
            case 'refAttestation':
              newFragments[fragmentType] = decodeBase64ZippedBase64(paramValue)
              break
            case 'merkle':
              newFragments[fragmentType] = decodeUriFragment<FullMerkleDataTree>(paramValue)
              break
            case 'proofs':
              newFragments[fragmentType] = decodeUriFragment<MerkleMultiProof>(paramValue)
              break
          }
        }
        catch (err) {
          console.error(`Ошибка декодирования ${fragmentType}:`, err)
          // Сохраняем ошибку, но продолжаем обработку других фрагментов
          if (!errorMessage) {
            errorMessage = (err as Error).message || `Произошла ошибка при загрузке ${fragmentType}`
          }
          newFragments[fragmentType] = null
        }
      })

      if (!foundAny) {
        setError('Не найдено ни одного фрагмента в URL')
      }
      else {
        setError(errorMessage) // Может быть null, если ошибок не было
      }
    }
    catch (err) {
      console.error('Ошибка при обработке URL:', err)
      setError((err as Error).message || 'Произошла ошибка при обработке URL')
    }
    finally {
      setFragments(newFragments)
      setLoading(false)
    }
  }, [])

  return { fragments, loading, error }
}

/**
 * Проверяет наличие фрагмента в URL
 * @param fragmentType - тип фрагмента для проверки
 * @returns true, если фрагмент присутствует в URL
 */
export function hasFragment(fragmentType: FragmentType): boolean {
  const fragment = window.location.hash
  return fragment.includes(FRAGMENTS[fragmentType])
}
