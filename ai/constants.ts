export enum Models {
  OpenAI4oMini = 'gpt-4o-mini',
}

export const DEFAULT_MODEL = Models.OpenAI4oMini
export const SUPPORTED_MODELS: string[] = [Models.OpenAI4oMini]

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
