import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  ignores: [],
  rules: {
    'n/prefer-global/process': ['off'],
    'no-console': ['warn'],
    'regexp/no-obscure-range': ['off'],
  },
})
