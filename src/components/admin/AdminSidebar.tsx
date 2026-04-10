'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

type Props = {
  unreadCount: number
  adminName: string | null
}

export default function AdminSidebar({ unreadCount, adminName }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin/orders', label: '受注一覧', badge: unreadCount > 0 ? unreadCount : null },
    { href: '/admin/partners', label: '取引先管理', badge: null },
    { href: '/admin/products', label: '商品マスタ', badge: null },
    { href: '/admin/assignments', label: '商品割り当て', badge: null },
  ]

  return (
    <div className="w-56 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="text-sm font-bold text-blue-300">かずさや</div>
        <div className="text-xs text-gray-400 mt-0.5">発注アプリ 管理画面</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{label}</span>
            {badge !== null && badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2 px-2">
          {adminName ?? '管理者'}
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
