const BASE_ROUTES = {
  CREATE_MULTIPLE: '/create-multiple',
  OFFCHAIN: '/offchain',
} as const

export const FRAGMENTS = {
  attestation: 'attestation=',
  proofs: 'proofs=',
  merkle: 'merkle=',
  refAttestation: 'refAttestation=',
} as const

export const routes = {
  createMultiple: BASE_ROUTES.CREATE_MULTIPLE,
  offchainView: (params: { attestation: string, proofs?: string, refAttestation?: string }) => {
    const { attestation, proofs, refAttestation } = params
    let url = `${BASE_ROUTES.OFFCHAIN}/url/#${FRAGMENTS.attestation}${encodeURIComponent(attestation)}`

    if (proofs)
      url += `&${FRAGMENTS.proofs}${encodeURIComponent(proofs)}`

    if (refAttestation)
      url += `&${FRAGMENTS.refAttestation}${encodeURIComponent(refAttestation)}`

    return url
  },
  offchainPrivate: (params: { attestation: string, merkle: string, refAttestation?: string }) => {
    const { attestation, merkle, refAttestation } = params
    let url = `${BASE_ROUTES.OFFCHAIN}/private/#${FRAGMENTS.attestation}${encodeURIComponent(attestation)}&${FRAGMENTS.merkle}${encodeURIComponent(merkle)}`

    if (refAttestation)
      url += `&${FRAGMENTS.refAttestation}${encodeURIComponent(refAttestation)}`

    return url
  },
} as const
