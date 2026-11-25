import { GlobalConfig } from '../config/config'

// TODO(A05): lives in core/api rather than the standard core/auth, the application being anonymous (no token to attach).
/** Calls the API under `GlobalConfig.API_URL` with a JSON content type (anonymous application). */
export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${GlobalConfig.API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}
