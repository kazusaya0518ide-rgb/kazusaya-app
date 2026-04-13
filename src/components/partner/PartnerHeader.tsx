'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export default function PartnerHeader({ partnerName }: { partnerName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/partner/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{partnerName}</div>
        <nav className="flex items-center gap-4">
          <Link
            href="/partner/orders"
            className={`text-sm font-medium transition-colors ${
              pathname === '/partner/orders' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            発注
          </Link>
          <Link
            href="/partner/history"
            className={`text-sm font-medium transition-colors ${
              pathname === '/partner/history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            発注履歴
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 min-h-0 min-w-0 px-0"
          >
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  )
}
