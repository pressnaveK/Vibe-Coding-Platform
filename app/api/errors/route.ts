import { Models } from '@/ai/constants'
import { getModelOptions } from '@/ai/gateway'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { linesSchema, resultSchema } from '@/components/error-monitor/schemas'
import prompt from './prompt.md'

export async function POST(req: Request) {
  const body = await req.json()
  const parsedBody = linesSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: `Invalid request` }, { status: 400 })
  }

  const { model, providerOptions } = getModelOptions(Models.OpenAI4oMini)

  const result = await generateObject({
    system: prompt,
    model,
    providerOptions,
    messages: [{ role: 'user', content: JSON.stringify(parsedBody.data) }],
    schema: resultSchema,
  })

  return NextResponse.json(result.object, {
    status: 200,
  })
}
