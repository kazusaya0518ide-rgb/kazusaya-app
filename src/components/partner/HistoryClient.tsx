'use client'

import { useState } from 'react'
import { Order } from '@/types'

export default function HistoryClient({ orders }: { orders: Order[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="pt-4">
      <h1 className="text-lg font-bold text-gray-800 mb-4">発注履歴</h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-12">発注履歴はありません</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const items = order.order_items ?? []
            const isExpanded = expandedId === order.id

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center px-4 py-4 text-left min-h-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-800">
                        発注日：{formatDate(order.order_date)}
                      </span>
                      {order.is_read ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">既読</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">未読</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      受信：{formatDateTime(order.created_at)} ／ {items.length}品目
                    </div>
                  </div>
                  <span className="text-gray-300 ml-2">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50 px-4 py-3">
                    {items.map((item) => {
                      const product = item.product as { name: string; spec: string | null; price: number | null } | undefined
                      const qty = item.case_qty > 0 ? `${item.case_qty} C/S` : `${item.unit_qty} 個`
                      return (
                        <div key={item.id} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                          <div className="flex-1">
                            <span className="text-gray-800">{product?.name}</span>
                            {product?.spec && <span className="text-xs text-gray-400 ml-2">{product.spec}</span>}
                          </div>
                          <span className="text-gray-700">{qty}</span>
                        </div>
                      )
                    })}
                    {order.note && (
                      <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-50">
                        備考：{order.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
