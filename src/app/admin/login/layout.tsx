import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '管理者ログイン | かずさや',
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
