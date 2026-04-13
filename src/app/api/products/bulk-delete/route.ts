import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const { ids } = await request.json() as { ids: string[] }
  if (!ids || ids.length === 0) return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 })

  const service = createServiceSupabase()
  const { error } = await service.from('products').delete().in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, deleted: ids.length })
}
