import { createGatewayProvider } from '@ai-sdk/gateway'
import { createOpenAI } from '@ai-sdk/openai'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import type { LanguageModelV2 } from '@ai-sdk/provider'

export async function getAvailableModels() {
  const gateway = gatewayInstance()
  if (gateway) {
    const response = await gateway.getAvailableModels()
    return response.models.map((model) => ({ id: model.id, name: model.name }))
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (openaiApiKey) {
    return [{ id: Models.OpenAI4oMini, name: 'OpenAI gpt-4o-mini' }]
  }

  throw new Error(
    'No model provider configured. Set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY or OPENAI_API_KEY in .env.local.'
  )
}

export interface ModelOptions {
  model: LanguageModelV2
  providerOptions?: Record<string, Record<string, JSONValue>>
  headers?: Record<string, string>
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: 'low' | 'medium' | 'high' }
): ModelOptions {
  const gateway = gatewayInstance()
  if (gateway) {
    return {
      model: gateway(modelId),
    }
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (openaiApiKey) {
    return {
      model: createOpenAI({ apiKey: openaiApiKey })(modelId),
      providerOptions: options?.reasoningEffort
        ? {
            openai: {
              reasoningEffort: options.reasoningEffort,
            } satisfies OpenAIResponsesProviderOptions,
          }
        : undefined,
    }
  }

  throw new Error(
    'No model provider configured. Set AI_GATEWAY_BASE_URL + AI_GATEWAY_API_KEY or OPENAI_API_KEY in .env.local.'
  )
}

function gatewayInstance() {
  const baseURL = process.env.AI_GATEWAY_BASE_URL
  const token =
    process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN ?? ''

  if (!baseURL || !token) {
    return null
  }

  return createGatewayProvider({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
  })
}
