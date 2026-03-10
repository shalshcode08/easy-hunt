import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^pg-boss$": "<rootDir>/tests/__mocks__/pg-boss.ts",
    "^playwright$": "<rootDir>/tests/__mocks__/playwright.ts",
    "^playwright-extra$": "<rootDir>/tests/__mocks__/playwright-extra.ts",
    "^puppeteer-extra-plugin-stealth$": "<rootDir>/tests/__mocks__/puppeteer-extra-plugin-stealth.ts",
  },
  setupFiles: ["<rootDir>/tests/setup.ts"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/db/migrations/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};

export default config;
