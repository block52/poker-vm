module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@bitcoinbrisbane/block52$': '<rootDir>/../../sdk/src/index.ts',
    '^@block52/poker-vm-sdk$': '<rootDir>/../../sdk/src/index.ts'
  },
  moduleDirectories: ['node_modules', '<rootDir>/../../sdk/node_modules'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        skipLibCheck: true
      }
    }]
  }
};
