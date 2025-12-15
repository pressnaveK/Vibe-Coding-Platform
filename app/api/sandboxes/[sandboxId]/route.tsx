import { NextRequest, NextResponse } from 'next/server'
import { Sandbox } from 'e2b'

/**
 * We must change the SDK to add data to the instance and then
 * use it to retrieve the status of the Sandbox.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params
  try {
    const info = await Sandbox.getInfo(sandboxId)
    return NextResponse.json({ status: info.state === 'running' ? 'running' : 'stopped' })
  } catch (error) {
    return NextResponse.json({ status: 'stopped', error: String(error) })
  }
}
