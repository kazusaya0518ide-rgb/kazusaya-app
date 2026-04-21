import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import OrderFormClient from '@/components/partner/OrderFormClient'

export default async function PartnerOrdersPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) redirect('/partner/login')

  // 取引先に割り当てられた商品を取得（display_order順・全件）
  const partnerProducts: any[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('partner_products')
      .select('id, display_order, order_count, product:products(id, code, name, spec, price, kana)')
      .eq('partner_id', partner.id)
      .order('display_order')
      .range(offset, offset + pageSize - 1)
    if (!data || data.length === 0) break
    partnerProducts.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  // あいうえお順（display_order → kana → name）
  const sorted = [...(partnerProducts ?? [])].sort((a, b) => {
    const da = a.display_order ?? 0
    const db = b.display_order ?? 0
    if (da !== db) return da - db
    const ka = (a.product?.kana ?? a.product?.name ?? '')
    const kb = (b.product?.kana ?? b.product?.name ?? '')
    return ka.localeCompare(kb, 'ja')
  })

  const products = (sorted
    .map((pp) => pp.product ? { ...pp.product, orderCount: pp.order_count ?? 0 } : null)
    .filter(Boolean) as unknown) as {
      id: string; code: string; name: string; spec: string | null
      price: number | null; kana: string | null; orderCount: number
    }[]

  return <OrderFormClient products={products} partnerId={partner.id} />
}
