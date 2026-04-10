'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Order } from '@/types'

type Stats = { today: number; unread: number; month: number }

export default function OrderListClient({
  orders,
  stats,
}: {
  orders: Order[]
  stats: Stats
}) {
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const filtered = tab === 'unread' ? orders.filter((o) => !o.is_read) : orders

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-5">受注一覧</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">本日の受注</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.today}<span className="text-base font-normal ml-1">件</span></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
          <div className="text-sm text-red-500">未読</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.unread}<span className="text-base font-normal ml-1">件</span></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">今月累計</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.month}<span className="text-base font-normal ml-1">件</span></div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setTab('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            tab === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          未読のみ
          {stats.unread > 0 && (
            <span className={`text-xs rounded-full px-1.5 ${tab === 'unread' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
              {stats.unread}
            </span>
          )}
        </button>
      </div>

      {/* 受注リスト */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">受注はありません</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={`flex items-center px-5 py-4 hover:bg-gray-50 transition-colors relative ${
                  !order.is_read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-800">
                      {(order.partner as { name: string } | undefined)?.name ?? '不明'}
                    </span>
                    {!order.is_read ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">未読</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">既読</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    発注日：{formatDate(order.order_date)} ／ 受信：{formatDateTime(order.created_at)}
                  </div>
                </div>
                <div className="text-gray-400 text-sm ml-4">›</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
