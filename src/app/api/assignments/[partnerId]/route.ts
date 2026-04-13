import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params
  const service = createServiceSupabase()

  const { data } = await service
    .from('partner_products')
    .select('id, display_order, product:products(id, name, spec, kana, price)')
    .eq('partner_id', partnerId)
    .order('display_order')

  const assigned = (data ?? []).map((row) => {
    const product = row.product as unknown as { id: string; name: string; spec: string | null; kana: string | null; price: number | null }
    return { ...product, pp_id: row.id }
  })

  return NextResponse.json({ assigned })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()
  const { product_ids } = await request.json()

  // 現在の最大 display_order を取得
  const { data: existing } = await service
    .from('partner_products')
    .select('display_order')
    .eq('partner_id', partnerId)
    .order('display_order', { ascending: false })
    .limit(1)

  const maxOrder = existing?.[0]?.display_order ?? -1

  const rows = (product_ids as string[]).map((pid, i) => ({
    partner_id: partnerId,
    product_id: pid,
    display_order: maxOrder + 1 + i,
  }))

  await service.from('partner_products').upsert(rows, { onConflict: 'partner_id,product_id' })

  // 最新リストを返す
  const { data } = await service
    .from('partner_products')
    .select('id, display_order, product:products(id, name, spec, kana, price)')
    .eq('partner_id', partnerId)
    .order('display_order')

  const assigned = (data ?? []).map((row) => {
    const product = row.product as unknown as { id: string; name: string; spec: string | null; kana: string | null; price: number | null }
    return { ...product, pp_id: row.id }
  })

  return NextResponse.json({ assigned })
}
