import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const service = createServiceSupabase()
  const { partner_id, order_date, note, items } = await request.json()

  if (!partner_id || !order_date || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  // 取引先確認
  const { data: partner } = await service
    .from('partners')
    .select('id, name')
    .eq('id', partner_id)
    .single()

  if (!partner) return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 })

  // 受注ヘッダ作成
  const { data: order, error: orderError } = await service
    .from('orders')
    .insert({ partner_id, order_date, note: note || null, is_read: false })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'エラー' }, { status: 400 })
  }

  // 受注明細作成
  const orderItems = items.map((item: { product_id: string; case_qty: number; unit_qty: number }) => ({
    order_id: order.id,
    product_id: item.product_id,
    case_qty: item.case_qty ?? 0,
    unit_qty: item.unit_qty ?? 0,
  }))

  const { error: itemsError } = await service.from('order_items').insert(orderItems)
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 })
  }

  // メール通知（NOTIFY_EMAIL が設定されている場合）
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const toAddresses = process.env.NOTIFY_EMAIL.split(',').map((e) => e.trim())
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
      const formatDateTime = (d: string) =>
        new Date(d).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

      await resend.emails.send({
        from: 'かずさや発注アプリ <noreply@resend.dev>',
        to: toAddresses,
        subject: `【かずさや発注アプリ】${partner.name}より新しいご注文があります`,
        text: [
          `${partner.name}より新しい発注がありました。`,
          '',
          `発注日：${formatDate(order_date)}`,
          `受信日時：${formatDateTime(order.created_at)}`,
          '',
          '▼ 管理画面で確認する',
          `${appUrl}/admin/orders/${order.id}`,
          '',
          '※このメールは自動送信です。',
        ].join('\n'),
      })
    } catch (e) {
      console.error('メール送信エラー:', e)
    }
  }

  return NextResponse.json({ order })
}
