// jest.config.js for TypeScript
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts", "jest-localstorage-mock"],

  moduleNameMapper: {
    // Style files
    "\\.(css|scss|sass|less|txt|png)$": "identity-obj-proxy",

    // Path alias
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  transform: {
    "^.+\\.(js|ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  clearMocks: true,
  transformIgnorePatterns: [
    "node_modules/(?!(@ionic|@stencil|@ionic/core|@ionic/react|ionicons|.*\\.mjs$))",
  ],
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleDirectories: ["node_modules", "src"], // @see https://stackoverflow.com/a/51174924/1614677
  preset: "ts-jest",
  resetMocks: true,
  restoreMocks: true,
  roots: ["<rootDir>/src"],
  testMatch: ["**/?(*.)+(spec).[tj]s?(x)"],
};
