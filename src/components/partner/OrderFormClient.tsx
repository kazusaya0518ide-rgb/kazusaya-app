'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = {
  id: string
  name: string
  spec: string | null
  price: number | null
}

type CartItem = {
  product: Product
  qty: number
  unit: '個' | 'C/S'
}

type Step = 'form' | 'confirm' | 'done'

export default function OrderFormClient({
  products,
  partnerId,
}: {
  products: Product[]
  partnerId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [inputQty, setInputQty] = useState<Record<string, { qty: string; unit: '個' | 'C/S' }>>({})
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState('')

  const inputItems = Array.from(cart.values())
  const otherProducts = products.filter((p) => !cart.has(p.id))

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
    if (!inputQty[id]) {
      setInputQty((prev) => ({ ...prev, [id]: { qty: '', unit: '個' } }))
    }
  }

  const confirmItem = (product: Product) => {
    const { qty, unit } = inputQty[product.id] ?? { qty: '', unit: '個' }
    const n = parseInt(qty)
    if (!n || n <= 0) return
    setCart((prev) => {
      const next = new Map(prev)
      next.set(product.id, { product, qty: n, unit })
      return next
    })
    setExpanded(null)
  }

  const removeItem = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    setInputQty((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const items = Array.from(cart.values()).map((item) => ({
      product_id: item.product.id,
      case_qty: item.unit === 'C/S' ? item.qty : 0,
      unit_qty: item.unit === '個' ? item.qty : 0,
    }))

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: partnerId, order_date: orderDate, note, items }),
    })

    if (res.ok) {
      const { order } = await res.json()
      setCompletedOrderId(order.id)
      setStep('done')
    }
    setSubmitting(false)
  }

  // ---- 完了画面 ----
  if (step === 'done') {
    return (
      <div className="pt-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">発注が完了しました</h1>
        <p className="text-gray-500 text-sm mb-1">
          ご発注ありがとうございます。
        </p>
        <p className="text-gray-500 text-sm mb-6">
          担当者が確認すると、発注履歴に「既読」と表示されます。
        </p>
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 text-sm text-gray-600">
          <div>発注品目数：{inputItems.length}品目</div>
          <div>発注日：{orderDate}</div>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          ※ キャンセル・変更は担当者（かずさや）へ電話でご連絡ください
        </p>
        <button
          onClick={() => { setCart(new Map()); setNote(''); setStep('form') }}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          発注画面に戻る
        </button>
      </div>
    )
  }

  // ---- 確認画面 ----
  if (step === 'confirm') {
    return (
      <div className="pt-6">
        <h1 className="text-lg font-bold text-gray-800 mb-1">発注内容の確認</h1>
        <p className="text-sm text-gray-500 mb-5">以下の内容で発注します。よろしいですか？</p>

        <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-600">発注日：{orderDate}</div>
          {inputItems.map((item) => (
            <div key={item.product.id} className="flex items-center px-4 py-3 border-t border-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.product.name}</div>
                {item.product.spec && <div className="text-xs text-gray-400">{item.product.spec}</div>}
              </div>
              <div className="text-gray-700 font-medium">{item.qty} {item.unit}</div>
            </div>
          ))}
          {note && (
            <div className="px-4 py-3 border-t border-gray-50 text-sm text-gray-600">
              備考：{note}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-4 font-medium hover:bg-gray-200"
          >
            ← 戻る
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-xl py-4 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '送信中...' : 'この内容で発注する'}
          </button>
        </div>
      </div>
    )
  }

  // ---- 発注入力画面 ----
  return (
    <div className="pt-4">
      {/* ヘッダー：発注日 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">発注</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">発注日</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 入力済み商品エリア */}
      {inputItems.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
            入力済み {inputItems.length}品目
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
            {inputItems.map((item) => (
              <div key={item.product.id} className="flex items-center px-4 py-3 border-b border-blue-100 last:border-0">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{item.product.name}</span>
                  {item.product.spec && <span className="text-xs text-gray-400 ml-2">{item.product.spec}</span>}
                </div>
                <span className="text-blue-700 font-medium mr-3">{item.qty} {item.unit}</span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-300 hover:text-red-400 text-sm min-h-0 min-w-0 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未入力商品リスト */}
      {otherProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          {otherProducts.map((product) => (
            <div key={product.id} className="border-b border-gray-50 last:border-0">
              {/* 商品行 */}
              <button
                onClick={() => toggleExpand(product.id)}
                className="w-full flex items-center px-4 py-3.5 text-left hover:bg-gray-50 transition-colors min-h-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800 text-base">{product.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{product.spec ?? ''}</span>
                </div>
                {product.price != null && (
                  <span className="text-sm text-gray-500 mr-3">{product.price.toLocaleString()}円</span>
                )}
                <span className="text-gray-300 text-lg">{expanded === product.id ? '▲' : '▼'}</span>
              </button>

              {/* 展開：数量入力 */}
              {expanded === product.id && (
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={inputQty[product.id]?.qty ?? ''}
                      onChange={(e) =>
                        setInputQty((prev) => ({
                          ...prev,
                          [product.id]: { ...prev[product.id], qty: e.target.value },
                        }))
                      }
                      placeholder="数量"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '20px' }}
                      autoFocus
                    />
                    <select
                      value={inputQty[product.id]?.unit ?? '個'}
                      onChange={(e) =>
                        setInputQty((prev) => ({
                          ...prev,
                          [product.id]: { ...prev[product.id], unit: e.target.value as '個' | 'C/S' },
                        }))
                      }
                      className="border border-gray-300 rounded-lg px-2 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="個">個</option>
                      <option value="C/S">C/S</option>
                    </select>
                    <button
                      onClick={() => confirmItem(product)}
                      className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700"
                    >
                      決定
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 備考 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">その他備考</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="納品希望時間・特記事項など"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 発注ボタン */}
      <button
        onClick={() => setStep('confirm')}
        disabled={cart.size === 0}
        className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        発注内容を確認する（{cart.size}品目）
      </button>
    </div>
  )
}
