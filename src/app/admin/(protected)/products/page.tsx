import { createServerSupabase } from '@/lib/supabase-server'
import ProductsClient from '@/components/admin/ProductsClient'

export default async function ProductsPage() {
  const supabase = await createServerSupabase()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('kana', { ascending: true, nullsFirst: false })

  return <ProductsClient products={products ?? []} />
}
