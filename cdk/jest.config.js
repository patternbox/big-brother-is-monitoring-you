module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.(spec|test|it).ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
