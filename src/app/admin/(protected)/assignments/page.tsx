import { createServerSupabase } from '@/lib/supabase-server'
import AssignmentsClient from '@/components/admin/AssignmentsClient'

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>
}) {
  const supabase = await createServerSupabase()
  const { partner: initialPartnerId } = await searchParams

  const { data: partners } = await supabase
    .from('partners')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const allProducts: any[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('products')
      .select('id, code, name, spec, kana, price')
      .eq('is_active', true)
      .order('kana', { nullsFirst: false })
      .range(offset, offset + pageSize - 1)
    if (!data || data.length === 0) break
    allProducts.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  return (
    <AssignmentsClient
      partners={partners ?? []}
      allProducts={allProducts}
      initialPartnerId={initialPartnerId ?? ''}
    />
  )
}
