declare global {
  var RUNTIME_CONFIG: {
    ENV: string
    API_URL: string
  }
}

type Config = {
  ENV: string
  API_URL: string
}

const rawConfig: Config = {
  ENV: globalThis.RUNTIME_CONFIG?.ENV,
  API_URL: globalThis.RUNTIME_CONFIG?.API_URL,
}

const GlobalConfig = rawConfig

export { GlobalConfig }
