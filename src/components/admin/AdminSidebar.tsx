'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

type Props = {
  unreadCount: number
  adminName: string | null
}

export default function AdminSidebar({ unreadCount, adminName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

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
    <>
      {/* スマホ：上部ヘッダーバー */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-gray-800 text-white flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-sm font-bold text-blue-300">かずさや</div>
          <div className="text-xs text-gray-400">管理画面</div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="メニュー"
        >
          <div className="space-y-1">
            <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* スマホ：ドロワーメニュー */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-gray-800 text-white p-3 space-y-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {navItems.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                prefetch={true}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{label}</span>
                {badge !== null && badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{badge}</span>
                )}
              </Link>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-xs text-gray-400 px-3 mb-1">{adminName ?? '管理者'}</div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PC：左サイドバー */}
      <div className="hidden sm:flex w-56 bg-gray-800 text-white flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="text-sm font-bold text-blue-300">かずさや</div>
          <div className="text-xs text-gray-400 mt-0.5">発注アプリ 管理画面</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, badge }) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{label}</span>
              {badge !== null && badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2 px-2">{adminName ?? '管理者'}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </>
  )
}
