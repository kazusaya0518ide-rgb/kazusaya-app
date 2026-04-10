import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import OrderDetailClient from '@/components/admin/OrderDetailClient'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      partner:partners(id, name),
      order_items(*, product:products(name, spec, price))
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  // 既読フラグ更新
  if (!order.is_read) {
    await supabase
      .from('orders')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
  }

  return <OrderDetailClient order={order} />
}
