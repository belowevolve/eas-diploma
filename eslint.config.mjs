import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import tailwind from 'eslint-plugin-tailwindcss'

const compat = new FlatCompat()

export default antfu({
  react: true,
  ignores: [],
  rules: {
    'n/prefer-global/process': ['off'],
    'no-console': ['warn'],
    'regexp/no-obscure-range': ['off'],
  },
}, tailwind.configs['flat/recommended'], ...compat.config({
  extends: [
    'plugin:@next/next/recommended',
  ],
}))
