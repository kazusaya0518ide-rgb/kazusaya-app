import { createServerSupabase } from '@/lib/supabase-server'
import ProductsClient from '@/components/admin/ProductsClient'

export default async function ProductsPage() {
  const supabase = await createServerSupabase()

  const all: any[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('kana', { ascending: true, nullsFirst: false })
      .range(offset, offset + pageSize - 1)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  return <ProductsClient products={all} />
}
