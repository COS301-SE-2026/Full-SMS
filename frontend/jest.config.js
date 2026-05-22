 const nextJest = require('next/jest')

  const createJestConfig = nextJest({
    dir: './',
  })

  const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  }

  module.exports = createJestConfig(customJestConfig)