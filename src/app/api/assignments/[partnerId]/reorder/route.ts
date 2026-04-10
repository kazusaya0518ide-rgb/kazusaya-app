import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const service = createServiceSupabase()
  const { order } = await request.json()

  for (const { pp_id, display_order } of order as { pp_id: string; display_order: number }[]) {
    await service
      .from('partner_products')
      .update({ display_order })
      .eq('id', pp_id)
  }

  return NextResponse.json({ ok: true })
}
