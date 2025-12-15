import { NextResponse, type NextRequest } from 'next/server'
import { readCommandLogs } from '@/lib/execution/trigger-e2b'
import type { CommandLogChunk } from '@/trigger/e2b-tasks'

interface Params {
  sandboxId: string
  cmdId: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const logParams = await params
  const encoder = new TextEncoder()
  try {
    const stream = await readCommandLogs(logParams.cmdId)
    return new NextResponse(
      new ReadableStream({
        async pull(controller) {
          for await (const logline of stream as AsyncIterable<CommandLogChunk>) {
            controller.enqueue(
              encoder.encode(JSON.stringify(logline) + '\n')
            )
          }
          controller.close()
        },
      }),
      { headers: { 'Content-Type': 'application/x-ndjson' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: String(error), sandboxId: logParams.sandboxId },
      { status: 500 }
    )
  }
}
