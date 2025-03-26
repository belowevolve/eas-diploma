import antfu from '@antfu/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

export default antfu(
  {
    react: true,
    typescript: true,
    ignores: ['migrations/**/*', 'next-env.d.ts', 'src/shared/contracts/**/*'],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      'no-console': ['warn'],
      'regexp/no-obscure-range': ['off'],
      'antfu/no-top-level-await': 'off',
      'node/prefer-global/process': 'off',
      'unused-imports/no-unused-imports': ['error'],
      'unused-imports/no-unused-vars': ['error'],
    },

  },
)
