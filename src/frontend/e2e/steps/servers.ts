// Addresses of the servers started by playwright.config.ts (BDD suite).
// Distinct from the regression (5199/5198) and development (5173) ports.
export const bddFrontendPort = 5197
export const bddApiPort = 5196
export const bddFrontendUrl = `http://127.0.0.1:${bddFrontendPort}`
// Base URL of the API under test, without `/api`.
export const bddApiUrl = `http://127.0.0.1:${bddApiPort}`
