import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '取引先ログイン | かずさや発注アプリ',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
