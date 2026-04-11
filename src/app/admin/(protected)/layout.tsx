import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: '管理画面 | かずさや',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // 管理者権限確認
  const { data: admin } = await supabase
    .from('admins')
    .select('id, name')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!admin) {
    redirect('/admin/login')
  }

  // 未読件数取得
  const { count: unreadCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar unreadCount={unreadCount ?? 0} adminName={admin.name} />
      <main className="flex-1 overflow-y-auto pt-14 sm:pt-0">
        {children}
      </main>
    </div>
  )
}
