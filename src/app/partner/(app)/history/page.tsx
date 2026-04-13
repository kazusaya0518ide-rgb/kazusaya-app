import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import HistoryClient from '@/components/partner/HistoryClient'

export default async function HistoryPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) redirect('/partner/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_date, created_at, is_read, note,
      order_items(*, product:products(name, spec, price))
    `)
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false })

  return <HistoryClient orders={(orders ?? []) as any} />
}
