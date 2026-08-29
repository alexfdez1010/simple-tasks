import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.agents/skills/**',
    'generated/**',
    'src/generated/**',
    '.heroui-docs/**',
  ]),
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\.\\/',
              message:
                "Use absolute imports with the '@/' alias instead of relative parent imports (e.g. '@/components/foo' not '../components/foo').",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
