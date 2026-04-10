import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()

  // 管理者確認
  const { data: admin } = await service
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { name, login_id, password } = await request.json()

  if (!name || !login_id || !password) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  // Supabase Auth にユーザー作成（email = login_id@kazusaya.app 形式）
  const email = `${login_id}@kazusaya.app`
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // partners テーブルに追加
  const { data: partner, error: dbError } = await service
    .from('partners')
    .insert({
      auth_user_id: authData.user.id,
      name,
      login_id,
      is_active: true,
    })
    .select()
    .single()

  if (dbError) {
    // ロールバック: Authユーザー削除
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ partner })
}
