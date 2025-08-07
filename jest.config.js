module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'shared/src/**/*.ts',
    '!shared/src/**/*.d.ts',
    '!shared/src/parser/grammar.js',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/src/$1'
  },
  setupFilesAfterEnv: [],
  verbose: true
};
