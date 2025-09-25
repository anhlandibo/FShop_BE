import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',  // chỉ test file .spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',          // bỏ qua bootstrap file
    '!src/**/*.module.ts',   // bỏ qua module (ít logic)
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',

  // 👇 alias src
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
