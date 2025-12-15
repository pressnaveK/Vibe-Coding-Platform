import { streams, task } from '@trigger.dev/sdk/v3'
import { CommandExitError, Sandbox } from 'e2b'

export type CommandLogChunk = {
  data: string
  stream: 'stdout' | 'stderr'
  timestamp: number
}

export type CommandTaskResult = {
  sandboxId: string
  command: string
  pid?: number
  exitCode?: number
  stdout: string
  stderr: string
}

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

export const createE2BSandboxTask = task({
  id: 'e2b-create-sandbox',
  run: async ({ timeoutMs, template }: CreateSandboxPayload) => {
    // Default E2B template is the code interpreter image which aligns with the Vibe sandbox needs.
    const sandbox = template
      ? await Sandbox.betaCreate(template, { timeoutMs })
      : await Sandbox.create({ timeoutMs })

    if (timeoutMs) {
      await Sandbox.setTimeout(sandbox.sandboxId, timeoutMs)
    }

    return {
      sandboxId: sandbox.sandboxId,
      sandboxDomain: sandbox.sandboxDomain,
      trafficAccessToken: sandbox.trafficAccessToken,
      template: template ?? 'default',
    }
  },
})

export const runE2BCommandTask = task({
  id: 'e2b-run-command',
  run: async ({ sandboxId, command, args = [], timeoutMs, envs }: RunCommandPayload) => {
    const sandbox = await Sandbox.connect(sandboxId)
    const cmd = [command, ...args].join(' ').trim()

    let exitCode: number | undefined
    let stdout = ''
    let stderr = ''
    let pid: number | undefined

    const { waitUntilComplete } = await streams.writer<CommandLogChunk>('logs', {
      execute: async ({ write }) => {
        const handle = await sandbox.commands.run(cmd, {
          background: true,
          timeoutMs,
          envs,
          onStdout: (data) => {
            stdout += data
            write({ data, stream: 'stdout', timestamp: Date.now() })
          },
          onStderr: (data) => {
            stderr += data
            write({ data, stream: 'stderr', timestamp: Date.now() })
          },
        })

        pid = handle.pid

        try {
          const result = await handle.wait()
          exitCode = result.exitCode
          stdout = result.stdout ?? stdout
          stderr = result.stderr ?? stderr
        } catch (error) {
          if (error instanceof CommandExitError) {
            exitCode = error.exitCode
            stderr = error.stderr ?? stderr
          } else {
            throw error
          }
        }
      },
    })

    await waitUntilComplete()

    return {
      sandboxId,
      command: cmd,
      pid,
      exitCode,
      stdout,
      stderr,
    }
  },
})
