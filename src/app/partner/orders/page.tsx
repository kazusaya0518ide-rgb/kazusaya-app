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

  // 取引先に割り当てられた商品を取得（表示順・全件）
  const partnerProducts: any[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('partner_products')
      .select('id, display_order, product:products(id, code, name, spec, price)')
      .eq('partner_id', partner.id)
      .order('display_order')
      .range(offset, offset + pageSize - 1)
    if (!data || data.length === 0) break
    partnerProducts.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  const products = ((partnerProducts ?? [])
    .map((pp) => pp.product)
    .filter(Boolean) as unknown) as { id: string; code: string; name: string; spec: string | null; price: number | null }[]

  return <OrderFormClient products={products} partnerId={partner.id} />
}
