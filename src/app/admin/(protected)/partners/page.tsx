import { createServerSupabase } from '@/lib/supabase-server'
import { createServiceSupabase } from '@/lib/supabase'
import PartnersClient from '@/components/admin/PartnersClient'

export default async function PartnersPage() {
  const supabase = await createServerSupabase()
  const service = createServiceSupabase()

  const { data: partners } = await service
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })

  // 各取引先の最終発注日と割り当て商品数を取得
  const lastOrders: Record<string, string | null> = {}
  const assignedCounts: Record<string, number> = {}

  if (partners) {
    // 並列で取得
    await Promise.all(partners.map(async (p) => {
      const [{ data: order }, { count }] = await Promise.all([
        service
          .from('orders')
          .select('created_at')
          .eq('partner_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        service
          .from('partner_products')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', p.id),
      ])
      lastOrders[p.id] = order?.created_at ?? null
      assignedCounts[p.id] = count ?? 0
    }))
  }

  return (
    <PartnersClient
      partners={partners ?? []}
      lastOrders={lastOrders}
      assignedCounts={assignedCounts}
    />
  )
}
