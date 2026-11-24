import { test as base, createBdd } from 'playwright-bdd'

// Shared test fixture and step/hook factories for the BDD suite.
// Step definitions go in e2e/steps/**/*.ts and import Given/When/Then from here.
export const test = base

export const { Given, When, Then, BeforeScenario, AfterScenario } =
  createBdd(test)
