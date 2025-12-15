import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { triggerCreateSandbox } from '@/lib/execution/trigger-e2b'
import { getRichError } from './get-rich-error'
import { tool } from 'ai'
import description from './create-sandbox.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const createSandbox = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      timeout: z
        .number()
        .min(600000)
        .max(3600000)
        .optional()
        .describe(
          'Maximum time in milliseconds the E2B sandbox will remain active before automatically shutting down. Minimum 600000ms (10 minutes), maximum 3600000ms (60 minutes). Defaults to 600000ms (10 minutes). The sandbox will terminate all running processes when this timeout is reached.'
        ),
      template: z
        .string()
        .optional()
        .describe(
          'Optional E2B template alias or ID to use for the sandbox (defaults to the standard code-interpreter image).'
        ),
    }),
    execute: async ({ timeout, template }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-create-sandbox',
        data: { status: 'loading' },
      })

      try {
        const sandbox = await triggerCreateSandbox({
          timeoutMs: timeout ?? 600000,
          template,
        })

        writer.write({
          id: toolCallId,
          type: 'data-create-sandbox',
          data: { sandboxId: sandbox.sandboxId, status: 'done' },
        })

        return (
          `Sandbox created with ID: ${sandbox.sandboxId}.` +
          `\nYou can now upload files, run commands, and access services on the exposed ports.`
        )
      } catch (error) {
        const richError = getRichError({
          action: 'Creating E2B sandbox via Trigger.dev',
          error,
        })

        writer.write({
          id: toolCallId,
          type: 'data-create-sandbox',
          data: {
            error: { message: richError.error.message },
            status: 'error',
          },
        })

        console.log('Error creating Sandbox:', richError.error)
        return richError.message
      }
    },
  })
