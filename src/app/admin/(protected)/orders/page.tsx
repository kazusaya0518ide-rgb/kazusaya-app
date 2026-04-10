import { createServerSupabase } from '@/lib/supabase-server'
import OrderListClient from '@/components/admin/OrderListClient'

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabase()

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = `${today.slice(0, 7)}-01`

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      partner:partners(id, name),
      order_items(*, product:products(name, spec, price))
    `)
    .order('created_at', { ascending: false })

  const { count: todayCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`)

  const { count: unreadCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  const { count: monthCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${firstOfMonth}T00:00:00`)

  return (
    <OrderListClient
      orders={orders ?? []}
      stats={{
        today: todayCount ?? 0,
        unread: unreadCount ?? 0,
        month: monthCount ?? 0,
      }}
    />
  )
}
