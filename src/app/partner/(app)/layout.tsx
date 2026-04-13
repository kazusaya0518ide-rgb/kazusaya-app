import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import PartnerHeader from '@/components/partner/PartnerHeader'

export const metadata: Metadata = {
  title: 'かずさや発注アプリ',
}

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/partner/login')

  const { data: partner } = await supabase
    .from('partners')
    .select('id, name')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!partner) redirect('/partner/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerHeader partnerName={partner.name} />
      <main className="max-w-2xl mx-auto px-4 pb-8">
        {children}
      </main>
    </div>
  )
}
