module.exports = {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/apps/backend',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@tcc/interfaces$': '<rootDir>/../../libs/interfaces/src/index.ts',
  },
};
