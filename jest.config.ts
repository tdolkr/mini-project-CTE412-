import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }
  },
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};

export default config;
