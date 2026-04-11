'use client'

import { useState } from 'react'

type Product = {
  id: string
  name: string
  spec: string | null
  price: number | null
}

type CartEntry = { qty: number; unit: '個' | 'C/S' }
type Step = 'form' | 'confirm' | 'done'

export default function OrderFormClient({
  products,
  partnerId,
}: {
  products: Product[]
  partnerId: string
}) {
  const [step, setStep] = useState<Step>('form')
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cartEntries = Object.entries(cart).filter(([, e]) => e.qty > 0)
  const totalItems = cartEntries.length

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => { const n = { ...prev }; delete n[id]; return n })
    } else {
      setCart((prev) => ({ ...prev, [id]: { qty, unit: prev[id]?.unit ?? '個' } }))
    }
  }

  const setUnit = (id: string, unit: '個' | 'C/S') => {
    setCart((prev) => ({ ...prev, [id]: { qty: prev[id]?.qty ?? 1, unit } }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const items = cartEntries.map(([product_id, { qty, unit }]) => ({
      product_id,
      case_qty: unit === 'C/S' ? qty : 0,
      unit_qty: unit === '個' ? qty : 0,
    }))

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: partnerId, order_date: orderDate, note, items }),
    })

    if (res.ok) setStep('done')
    setSubmitting(false)
  }

  // ---- 完了画面 ----
  if (step === 'done') {
    return (
      <div className="pt-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">発注が完了しました</h1>
        <p className="text-gray-500 text-sm mb-1">ご発注ありがとうございます。</p>
        <p className="text-gray-500 text-sm mb-6">
          担当者が確認すると、発注履歴に「既読」と表示されます。
        </p>
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 text-sm text-gray-600">
          <div>発注品目数：{totalItems}品目</div>
          <div>発注日：{orderDate}</div>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          ※ キャンセル・変更は担当者（かずさや）へ電話でご連絡ください
        </p>
        <button
          onClick={() => { setCart({}); setNote(''); setStep('form') }}
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
        <p className="text-sm text-gray-500 mb-4">以下の内容で発注します。よろしいですか？</p>

        <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
            発注日：{orderDate}
          </div>
          {cartEntries.map(([id, { qty, unit }]) => {
            const product = products.find((p) => p.id === id)!
            return (
              <div key={id} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                  {product.spec && <div className="text-xs text-gray-400">{product.spec}</div>}
                </div>
                <div className="text-gray-700 font-medium text-sm ml-3 shrink-0">{qty} {unit}</div>
              </div>
            )
          })}
          {note && (
            <div className="px-4 py-3 border-t border-gray-50 text-sm text-gray-600">
              備考：{note}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3.5 font-medium hover:bg-gray-200 text-sm"
          >
            ← 戻る
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3.5 font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800">発注</h1>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400">発注日</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* 商品リスト */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
        {products.map((product) => {
          const entry = cart[product.id]
          const qty = entry?.qty ?? 0
          const unit = entry?.unit ?? '個'
          const inCart = qty > 0

          return (
            <div
              key={product.id}
              className={`flex items-center px-3 py-2.5 border-b border-gray-50 last:border-0 transition-colors ${inCart ? 'bg-blue-50' : ''}`}
            >
              {/* 商品情報 */}
              <div className="flex-1 min-w-0 mr-2">
                <span className={`text-sm font-medium ${inCart ? 'text-blue-800' : 'text-gray-800'}`}>
                  {product.name}
                </span>
                {product.spec && (
                  <span className="text-xs text-gray-400 ml-1.5">{product.spec}</span>
                )}
              </div>

              {/* ステッパー */}
              <div className="flex items-center gap-1 shrink-0">
                {/* 単位セレクタ：数量が入っているときだけ表示 */}
                {inCart && (
                  <select
                    value={unit}
                    onChange={(e) => setUnit(product.id, e.target.value as '個' | 'C/S')}
                    className="text-xs border border-gray-200 rounded px-1 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  >
                    <option value="個">個</option>
                    <option value="C/S">C/S</option>
                  </select>
                )}

                {/* − ボタン */}
                <button
                  onClick={() => setQty(product.id, qty - 1)}
                  disabled={!inCart}
                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 text-lg leading-none flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 transition-colors"
                >
                  −
                </button>

                {/* 数量表示・直接入力 */}
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={qty === 0 ? '' : qty}
                  onChange={(e) => {
                    const v = e.target.value
                    setQty(product.id, v === '' ? 0 : Math.max(0, parseInt(v) || 0))
                  }}
                  placeholder="0"
                  className={`w-10 h-8 text-center text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    inCart
                      ? 'border-blue-300 text-blue-700 bg-white'
                      : 'border-gray-200 text-gray-400 bg-gray-50'
                  }`}
                />

                {/* + ボタン */}
                <button
                  onClick={() => setQty(product.id, qty + 1)}
                  className="w-8 h-8 rounded-lg bg-blue-600 text-white text-lg leading-none flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 備考 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">備考</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="納品希望時間・特記事項など"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      {/* 発注ボタン */}
      <button
        onClick={() => setStep('confirm')}
        disabled={totalItems === 0}
        className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {totalItems === 0 ? '商品を選択してください' : `発注内容を確認する（${totalItems}品目）`}
      </button>
    </div>
  )
}
