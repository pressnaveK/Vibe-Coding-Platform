import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { Sandbox } from 'e2b'
import { tool } from 'ai'
import description from './get-sandbox-url.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const getSandboxURL = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sandboxId: z
        .string()
        .describe(
          "The unique identifier of the E2B sandbox (e.g., 'sbx_abc123xyz'). This ID is returned when creating a sandbox and is used to reference the specific sandbox instance."
        ),
      port: z
        .number()
        .describe(
          'The port number where a service is running inside the E2B sandbox (e.g., 3000 for Next.js dev server, 8000 for Python apps, 5000 for Flask).'
        ),
    }),
    execute: async ({ sandboxId, port }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-get-sandbox-url',
        data: { status: 'loading' },
      })

      try {
        const sandbox = await Sandbox.connect(sandboxId)
        const url = sandbox.getHost(port)

        writer.write({
          id: toolCallId,
          type: 'data-get-sandbox-url',
          data: { url, status: 'done' },
        })

        return { url }
      } catch (error) {
        writer.write({
          id: toolCallId,
          type: 'data-get-sandbox-url',
          data: { status: 'done' },
        })
        return `Failed to retrieve exposed URL for sandbox ${sandboxId} on port ${port}: ${String(
          error
        )}`
      }
    },
  })
