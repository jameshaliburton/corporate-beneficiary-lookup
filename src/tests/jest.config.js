module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1'
  },
  
  testMatch: [
    '<rootDir>/**/*.test.{ts,tsx}',
    '<rootDir>/**/*.spec.{ts,tsx}'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  verbose: true
};