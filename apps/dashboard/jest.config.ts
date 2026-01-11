export default {
  displayName: 'dashboard',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/dashboard',
  testMatch: [
    '<rootDir>/test/**/*.spec.ts'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [],
  moduleFileExtensions: ['ts', 'js', 'html', 'mjs'],
  moduleNameMapper: {
    '^@vmekala/data$': '<rootDir>/../../libs/data/src/index.ts',
    '^@vmekala/auth$': '<rootDir>/../../libs/auth/src/index.ts',
  },
  collectCoverageFrom: [
    'src/app/services/**/*.ts',
    'src/app/guards/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/test-setup.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
