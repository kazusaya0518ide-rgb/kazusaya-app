import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()
  const { items } = await request.json()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'データがありません' }, { status: 400 })
  }

  // upsert（商品コードで重複チェック）
  const { error } = await service
    .from('products')
    .upsert(
      items.map((item: { code: string; name: string; spec?: string | null; price?: number | null; kana?: string | null }) => ({
        code: item.code,
        name: item.name,
        spec: item.spec ?? null,
        price: item.price ?? null,
        kana: item.kana ?? null,
        is_active: true,
      })),
      { onConflict: 'code' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 最新の商品一覧を返す
  const { data: products } = await service
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('kana', { ascending: true, nullsFirst: false })

  return NextResponse.json({ products: products ?? [] })
}
