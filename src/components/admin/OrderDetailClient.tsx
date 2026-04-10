'use client'

import Link from 'next/link'
import { Order } from '@/types'

export default function OrderDetailClient({ order }: { order: Order }) {
  const partner = order.partner as { name: string } | undefined
  const items = order.order_items ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-3xl">
      {/* 戻るボタン */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 no-print"
      >
        ← 受注一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-800">
                {partner?.name}
              </h1>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">既読</span>
            </div>
            <dl className="space-y-1 text-sm text-gray-600">
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20">発注日</dt>
                <dd>{formatDate(order.order_date)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20">受信日時</dt>
                <dd>{formatDateTime(order.created_at)}</dd>
              </div>
              {order.read_at && (
                <div className="flex gap-3">
                  <dt className="text-gray-400 w-20">既読日時</dt>
                  <dd>{formatDateTime(order.read_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          <button
            onClick={handlePrint}
            className="no-print bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            受注書を印刷
          </button>
        </div>
      </div>

      {/* 受注明細 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">商品名</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">規格</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">数量</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">販売価格</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const product = item.product as { name: string; spec: string | null; price: number | null } | undefined
              const qty = item.case_qty && item.case_qty > 0
                ? `${item.case_qty} C/S`
                : `${item.unit_qty} 個`
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-gray-800">{product?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{product?.spec ?? '－'}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{qty}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {product?.price != null ? `${product.price.toLocaleString()}円` : '－'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 備考 */}
      {order.note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-sm font-medium text-yellow-800 mb-1">その他備考</div>
          <div className="text-gray-700">{order.note}</div>
        </div>
      )}

      {/* 印刷用レイアウト */}
      <div className="print-only font-mono text-sm mt-8">
        <pre>{`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
　　　受注書（かずさや発注アプリ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
取引先名：${partner?.name ?? ''}
発注日　：${formatDate(order.order_date)}
受信日時：${formatDateTime(order.created_at)}
────────────────────────────────────
商品名　　　　　　　　　規格　　数量　　販売価格
────────────────────────────────────
${items.map((item) => {
  const p = item.product as { name: string; spec: string | null; price: number | null } | undefined
  const qty = item.case_qty && item.case_qty > 0 ? `${item.case_qty} C/S` : `${item.unit_qty} 個`
  return `${(p?.name ?? '').padEnd(18)}${(p?.spec ?? '－').padEnd(8)}${qty.padEnd(8)}${p?.price != null ? p.price + '円' : '－'}`
}).join('\n')}
────────────────────────────────────
${order.note ? 'その他：' + order.note : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}</pre>
      </div>
    </div>
  )
}
