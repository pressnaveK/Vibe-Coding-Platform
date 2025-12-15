import { runs, streams, tasks } from '@trigger.dev/sdk/v3'
import type {
  CommandLogChunk,
  createE2BSandboxTask,
  runE2BCommandTask,
} from '@/trigger/e2b-tasks'

type CreateSandboxPayload = {
  timeoutMs?: number
  template?: string
}

type RunCommandPayload = {
  sandboxId: string
  command: string
  args?: string[]
  timeoutMs?: number
  envs?: Record<string, string>
}

function ensureTriggerConfigured() {
  if (!process.env.TRIGGER_API_KEY) {
    throw new Error(
      'TRIGGER_API_KEY is not set. Configure Trigger.dev credentials to run commands.'
    )
  }
  if (!process.env.TRIGGER_SECRET_KEY) {
    throw new Error(
      'TRIGGER_SECRET_KEY is not set. Add it to .env.local so the server can call Trigger.dev.'
    )
  }
}

export async function triggerCreateSandbox(payload: CreateSandboxPayload) {
  ensureTriggerConfigured()
  const handle = await tasks.trigger<typeof createE2BSandboxTask>(
    'e2b-create-sandbox',
    payload
  )

  const result = await runs.poll(handle.id)
  if (result.error) {
    throw new Error(
      typeof result.error === 'object'
        ? JSON.stringify(result.error)
        : String(result.error)
    )
  }

  const run = await runs.retrieve(handle.id)
  return run.output as {
    sandboxId: string
    sandboxDomain?: string
    trafficAccessToken?: string
    template: string
  }
}

export async function triggerRunCommand(payload: RunCommandPayload) {
  ensureTriggerConfigured()
  const handle = await tasks.trigger<typeof runE2BCommandTask>(
    'e2b-run-command',
    payload
  )

  return { runId: handle.id }
}

export async function readCommandLogs(runId: string) {
  ensureTriggerConfigured()
  return streams.read<CommandLogChunk>(runId, 'logs')
}

export async function retrieveCommandRun(runId: string) {
  ensureTriggerConfigured()
  return runs.retrieve(runId)
}
