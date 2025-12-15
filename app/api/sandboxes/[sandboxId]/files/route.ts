import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from 'e2b'
import z from 'zod/v3'

const FileParamsSchema = z.object({
  sandboxId: z.string(),
  path: z.string(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params
  const fileParams = FileParamsSchema.safeParse({
    path: request.nextUrl.searchParams.get('path'),
    sandboxId,
  })

  if (fileParams.success === false) {
    return NextResponse.json(
      { error: 'Invalid parameters. You must pass a `path` as query' },
      { status: 400 }
    )
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId)
    const stream = await sandbox.files.read(fileParams.data.path, {
      format: 'stream',
    })
    if (!stream) {
      return NextResponse.json(
        { error: 'File not found in the sandbox' },
        { status: 404 }
      )
    }

    const reader = stream.getReader()

    return new NextResponse(
      new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          controller.enqueue(value)
        },
      })
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to read file: ${String(error)}` },
      { status: 500 }
    )
  }
}
