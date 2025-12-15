import { NextResponse, type NextRequest } from 'next/server'
import { retrieveCommandRun } from '@/lib/execution/trigger-e2b'
import type { CommandTaskResult } from '@/trigger/e2b-tasks'

interface Params {
  sandboxId: string
  cmdId: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const cmdParams = await params
  try {
    const run = await retrieveCommandRun(cmdParams.cmdId)
    const output = (run.output ?? {}) as CommandTaskResult
    return NextResponse.json({
      sandboxId: cmdParams.sandboxId,
      cmdId: cmdParams.cmdId,
      startedAt: run.startedAt?.getTime() ?? Date.now(),
      exitCode: output.exitCode,
    })
  } catch (error) {
    return NextResponse.json(
      {
        sandboxId: cmdParams.sandboxId,
        cmdId: cmdParams.cmdId,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
