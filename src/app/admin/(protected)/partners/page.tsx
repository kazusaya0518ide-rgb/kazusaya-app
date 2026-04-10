import { createServerSupabase } from '@/lib/supabase-server'
import PartnersClient from '@/components/admin/PartnersClient'

export default async function PartnersPage() {
  const supabase = await createServerSupabase()

  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })

  // 各取引先の最終発注日を取得
  const lastOrders: Record<string, string | null> = {}
  if (partners) {
    for (const p of partners) {
      const { data } = await supabase
        .from('orders')
        .select('created_at')
        .eq('partner_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      lastOrders[p.id] = data?.created_at ?? null
    }
  }

  return <PartnersClient partners={partners ?? []} lastOrders={lastOrders} />
}
