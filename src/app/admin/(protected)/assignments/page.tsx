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

  const { data: products } = await supabase
    .from('products')
    .select('id, code, name, spec, kana, price')
    .eq('is_active', true)
    .order('kana', { nullsFirst: false })

  return (
    <AssignmentsClient
      partners={partners ?? []}
      allProducts={products ?? []}
      initialPartnerId={initialPartnerId ?? ''}
    />
  )
}
