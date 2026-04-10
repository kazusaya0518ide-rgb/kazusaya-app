import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ ppId: string }> }
) {
  const { ppId } = await params
  const service = createServiceSupabase()
  await service.from('partner_products').delete().eq('id', ppId)
  return NextResponse.json({ ok: true })
}
