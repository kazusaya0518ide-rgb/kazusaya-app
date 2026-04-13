import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()

  const { data: admin } = await service
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.login_id !== undefined) updates.login_id = body.login_id
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data: partner, error } = await service
    .from('partners')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // パスワード変更
  if (body.password && body.password.length > 0) {
    await service.auth.admin.updateUserById(partner.auth_user_id, {
      password: body.password,
    })
  }

  // is_active=false の場合、Authユーザーを無効化
  if (body.is_active === false) {
    await service.auth.admin.updateUserById(partner.auth_user_id, {
      ban_duration: '876600h', // 100年
    })
  } else if (body.is_active === true) {
    await service.auth.admin.updateUserById(partner.auth_user_id, {
      ban_duration: 'none',
    })
  }

  return NextResponse.json({ partner })
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()

  const { data: admin } = await service
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  // auth_user_idを取得してAuthユーザーも削除
  const { data: partner } = await service
    .from('partners')
    .select('auth_user_id')
    .eq('id', id)
    .single()

  await service.from('partners').delete().eq('id', id)

  if (partner?.auth_user_id) {
    await service.auth.admin.deleteUser(partner.auth_user_id)
  }

  return NextResponse.json({ ok: true })
}
