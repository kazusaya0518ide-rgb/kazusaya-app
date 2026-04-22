'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

type Product = {
  id: string
  name: string
  spec: string | null
  price: number | null
  kana: string | null
  orderCount: number
}

type CartEntry = { qty: number; returnQty: number; unit: '個' | 'C/S' }
type Step = 'form' | 'confirm' | 'done'

// かな行フィルター定義
const KANA_ROWS = [
  { label: '⭐', key: 'freq' },
  { label: 'あ', key: 'あ' },
  { label: 'か', key: 'か' },
  { label: 'さ', key: 'さ' },
  { label: 'た', key: 'た' },
  { label: 'な', key: 'な' },
  { label: 'は', key: 'は' },
  { label: 'ま', key: 'ま' },
  { label: 'や', key: 'や' },
  { label: 'ら', key: 'ら' },
  { label: 'わ', key: 'わ' },
  { label: '他', key: 'other' },
]

// カタカナ範囲（行フィルター用）
const KANA_RANGES: Record<string, [string, string]> = {
  あ: ['ア', 'オ'], か: ['カ', 'ゴ'], さ: ['サ', 'ゾ'],
  た: ['タ', 'ド'], な: ['ナ', 'ノ'], は: ['ハ', 'ポ'],
  ま: ['マ', 'モ'], や: ['ヤ', 'ヨ'], ら: ['ラ', 'ロ'],
  わ: ['ワ', 'ン'],
}

function toKatakana(c: string): string {
  const code = c.charCodeAt(0)
  return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : c
}

function inKanaRow(kana: string | null, rowKey: string): boolean {
  const range = KANA_RANGES[rowKey]
  if (!range || !kana) return false
  const kata = toKatakana(kana[0] ?? '')
  return kata >= range[0] && kata <= range[1]
}

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
  const [search, setSearch] = useState('')
  const [kanaFilter, setKanaFilter] = useState('')
  const [showReturnFor, setShowReturnFor] = useState<Set<string>>(new Set())
  const listTopRef = useRef<HTMLDivElement>(null)

  // 配送行・返品行を別々のラインとして展開
  const allCartLines = useMemo(() =>
    Object.entries(cart).flatMap(([id, e]) => {
      type Line = { id: string; productId: string; qty: number; unit: '個' | 'C/S'; isReturn: boolean }
      const lines: Line[] = []
      if (e.qty !== 0) lines.push({ id, productId: id, qty: e.qty, unit: e.unit, isReturn: false })
      if (e.returnQty !== 0) lines.push({ id: id + '_ret', productId: id, qty: e.returnQty, unit: e.unit, isReturn: true })
      return lines
    }), [cart]
  )

  const totalItems = allCartLines.length
  const returnItems = allCartLines.filter((l) => l.isReturn).length
  const hasFreq = products.some((p) => p.orderCount > 0)

  // 納品数量セット（0以上にクランプ）
  const setDeliveryQty = (id: string, qty: number) => {
    setCart((prev) => {
      const entry = prev[id] ?? { qty: 0, returnQty: 0, unit: '個' }
      const newQty = Math.max(0, qty)
      if (newQty === 0 && entry.returnQty === 0) {
        const n = { ...prev }; delete n[id]; return n
      }
      return { ...prev, [id]: { ...entry, qty: newQty } }
    })
  }

  // 返品数量セット（0以下にクランプ）
  const setReturnQty = (id: string, returnQty: number) => {
    const clamped = Math.min(0, returnQty)
    setCart((prev) => {
      const entry = prev[id] ?? { qty: 0, returnQty: 0, unit: '個' }
      if (clamped === 0 && entry.qty === 0) {
        const n = { ...prev }; delete n[id]; return n
      }
      return { ...prev, [id]: { ...entry, returnQty: clamped } }
    })
    if (clamped === 0) {
      setShowReturnFor((s) => { const ns = new Set(s); ns.delete(id); return ns })
    }
  }

  const setUnit = (id: string, unit: '個' | 'C/S') => {
    setCart((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { qty: 0, returnQty: 0 }), unit },
    }))
  }

  // 返品行を追加（初期値 -1）
  const addReturnRow = (id: string) => {
    setShowReturnFor((s) => { const ns = new Set(s); ns.add(id); return ns })
    setCart((prev) => {
      const entry = prev[id] ?? { qty: 0, returnQty: 0, unit: '個' }
      if (entry.returnQty !== 0) return prev
      return { ...prev, [id]: { ...entry, returnQty: -1 } }
    })
  }

  // 返品行を削除
  const removeReturnRow = (id: string) => {
    setShowReturnFor((s) => { const ns = new Set(s); ns.delete(id); return ns })
    setCart((prev) => {
      const entry = prev[id]
      if (!entry) return prev
      if (entry.qty === 0) {
        const n = { ...prev }; delete n[id]; return n
      }
      return { ...prev, [id]: { ...entry, returnQty: 0 } }
    })
  }

  const filteredProducts = useMemo(() => {
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.kana ?? '').toLowerCase().includes(q) ||
          (p.spec ?? '').toLowerCase().includes(q)
      )
    }
    if (kanaFilter === 'freq') return products.filter((p) => p.orderCount > 0)
    if (kanaFilter === 'other') {
      return products.filter(
        (p) => !Object.keys(KANA_RANGES).some((k) => inKanaRow(p.kana, k))
      )
    }
    if (kanaFilter) return products.filter((p) => inKanaRow(p.kana, kanaFilter))
    return products
  }, [products, search, kanaFilter])

  // フィルター変更でリスト先頭へ
  useEffect(() => {
    listTopRef.current?.scrollIntoView({ block: 'start' })
  }, [search, kanaFilter])

  const handleSubmit = async () => {
    setSubmitting(true)
    const items = Object.entries(cart).flatMap(([product_id, { qty, returnQty, unit }]) => {
      const lines: Array<{ product_id: string; case_qty: number; unit_qty: number }> = []
      if (qty !== 0) lines.push({
        product_id,
        case_qty: unit === 'C/S' ? qty : 0,
        unit_qty: unit === '個' ? qty : 0,
      })
      if (returnQty !== 0) lines.push({
        product_id,
        case_qty: unit === 'C/S' ? returnQty : 0,
        unit_qty: unit === '個' ? returnQty : 0,
      })
      return lines
    })
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: partnerId, order_date: orderDate, note, items }),
    })
    if (res.ok) setStep('done')
    setSubmitting(false)
  }

  // ───────────────────────────────────────
  // 完了画面
  // ───────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-12">
        <div className="text-6xl mb-5">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">発注が完了しました</h1>
        <p className="text-gray-500 text-sm mb-1">ご発注ありがとうございます。</p>
        <p className="text-gray-500 text-sm mb-6">
          担当者が確認すると、発注履歴に「既読」と表示されます。
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-sm text-gray-600 w-full max-w-xs">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-400">発注品目数</span>
            <span className="font-bold text-gray-700">{totalItems} 品目</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">発注日</span>
            <span className="font-medium">{orderDate}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-8">
          ※ キャンセル・変更は担当者（かずさや）へ電話でご連絡ください
        </p>
        <button
          onClick={() => { setCart({}); setNote(''); setShowReturnFor(new Set()); setStep('form') }}
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md touch-manipulation"
        >
          続けて発注する
        </button>
      </div>
    )
  }

  // ───────────────────────────────────────
  // 確認画面
  // ───────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="pt-4 pb-32">
        <h1 className="text-lg font-bold text-gray-800 mb-1">発注内容の確認</h1>
        <p className="text-sm text-gray-500 mb-4">以下の内容で発注します。よろしいですか？</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 text-sm border-b border-gray-100 flex justify-between">
            <span className="text-gray-500">発注日</span>
            <span className="font-semibold text-gray-700">{orderDate}</span>
          </div>
          {allCartLines.map(({ id, productId, qty, unit, isReturn }) => {
            const p = products.find((x) => x.id === productId)!
            return (
              <div key={id} className={`flex items-center px-4 py-3.5 border-b border-gray-50 last:border-0 gap-2 ${isReturn ? 'bg-red-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${isReturn ? 'text-red-700' : 'text-gray-800'}`}>
                    {p.name}{isReturn && <span className="ml-1 text-xs font-normal">（返品）</span>}
                  </div>
                  {p.spec && <div className="text-xs text-gray-400 mt-0.5">{p.spec}</div>}
                </div>
                <div className={`shrink-0 font-bold text-sm px-3 py-1 rounded-full ${
                  isReturn ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {qty} {unit}
                </div>
              </div>
            )
          })}
          {note && (
            <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-600 bg-yellow-50">
              <span className="text-gray-400">備考：</span>{note}
            </div>
          )}
        </div>

        {/* 固定ボタンバー */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-2px_12px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setStep('form')}
            className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all touch-manipulation"
          >
            ← 戻る
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] bg-blue-600 text-white rounded-2xl py-4 font-bold text-sm hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-md touch-manipulation"
          >
            {submitting ? '送信中...' : 'この内容で発注する'}
          </button>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────
  // 発注入力画面
  // ───────────────────────────────────────
  return (
    <div className="pt-3 pb-28">
      {/* 発注日 */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs font-medium text-gray-500 shrink-0">発注日</label>
        <input
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
        />
      </div>

      {/* 検索バー */}
      <div className="relative mb-2">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setKanaFilter('') }}
          placeholder="商品名・よみがなで検索"
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 text-lg touch-manipulation"
          >×</button>
        )}
      </div>

      {/* かな行フィルター */}
      {!search && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setKanaFilter('')}
            className={`shrink-0 h-9 px-3.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
              kanaFilter === '' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >全</button>
          {KANA_ROWS.filter((r) => r.key !== 'freq' || hasFreq).map((row) => (
            <button
              key={row.key}
              onClick={() => setKanaFilter(kanaFilter === row.key ? '' : row.key)}
              className={`shrink-0 h-9 px-3.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                kanaFilter === row.key
                  ? 'bg-blue-600 text-white shadow'
                  : row.key === 'freq'
                  ? 'bg-orange-50 text-orange-500 border border-orange-200'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >{row.label}</button>
          ))}
        </div>
      )}

      {/* 件数表示 */}
      <div className="text-xs text-gray-400 mt-1 mb-2">
        {search
          ? `「${search}」：${filteredProducts.length}件`
          : kanaFilter === 'freq' ? `よく注文する商品：${filteredProducts.length}件`
          : kanaFilter ? `${kanaFilter}行：${filteredProducts.length}件`
          : `全 ${filteredProducts.length}件`}
        {totalItems > 0 && (
          <span className="ml-2 text-blue-600 font-semibold">カート：{totalItems}品目</span>
        )}
      </div>

      {/* スクロール先頭マーカー */}
      <div ref={listTopRef} />

      {/* 商品リスト */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm">該当する商品がありません</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
          {filteredProducts.map((product) => {
            const entry = cart[product.id]
            const qty = entry?.qty ?? 0
            const returnQty = entry?.returnQty ?? 0
            const unit = entry?.unit ?? '個'
            const inCart = qty !== 0
            const returnMag = Math.abs(returnQty)
            const showReturn = showReturnFor.has(product.id) || returnQty !== 0
            const canAddReturn = qty > 0 && !showReturn

            return (
              <div key={product.id} className="flex flex-col">
                {/* ── 納品行 ── */}
                <div className={`flex items-center px-3 py-2 transition-colors ${
                  inCart ? 'bg-blue-50' : 'bg-white'
                }`}>
                  {/* 商品情報 */}
                  <div className="flex-1 min-w-0 mr-2 py-0.5">
                    <span className={`text-sm font-medium ${
                      inCart ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {product.name}
                    </span>
                    {product.spec && (
                      <span className="text-xs text-gray-400 ml-1.5">{product.spec}</span>
                    )}
                  </div>

                  {/* 数量操作 — 全要素を常にレイアウトに置き + ボタンの位置を固定 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* 単位選択：常に表示、未選択時は非表示（スペース確保） */}
                    <select
                      value={unit}
                      onChange={(e) => setUnit(product.id, e.target.value as '個' | 'C/S')}
                      className={`h-10 text-xs border border-gray-200 rounded-xl px-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white transition-all ${
                        !inCart ? 'invisible pointer-events-none' : ''
                      }`}
                    >
                      <option value="個">個</option>
                      <option value="C/S">C/S</option>
                    </select>

                    <button
                      onClick={() => setDeliveryQty(product.id, qty - 1)}
                      aria-label="減らす"
                      className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 text-xl flex items-center justify-center active:scale-90 transition-all touch-manipulation hover:bg-gray-100"
                    >−</button>

                    <input
                      type="number"
                      inputMode="numeric"
                      value={qty === 0 ? '' : qty}
                      onChange={(e) => {
                        const v = e.target.value
                        setDeliveryQty(product.id, v === '' ? 0 : (parseInt(v) || 0))
                      }}
                      placeholder="0"
                      className={`w-11 h-10 text-center text-sm font-bold rounded-xl border focus:outline-none focus:ring-2 transition-colors ${
                        inCart
                          ? 'border-blue-400 text-blue-700 bg-white focus:ring-blue-400'
                          : 'border-gray-200 text-gray-400 bg-gray-50 focus:ring-blue-400'
                      }`}
                    />

                    <button
                      onClick={() => setDeliveryQty(product.id, qty + 1)}
                      aria-label="増やす"
                      className="w-10 h-10 rounded-xl bg-blue-600 text-white text-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all touch-manipulation shadow-sm"
                    >+</button>

                    {/* 返品ボタン：常にレイアウトに存在、+ の右隣を固定してズレを防止 */}
                    <button
                      onClick={canAddReturn ? () => addReturnRow(product.id) : undefined}
                      aria-label="返品を追加"
                      className={`h-10 px-2 rounded-xl border text-xs font-medium touch-manipulation ml-0.5 transition-all ${
                        canAddReturn
                          ? 'border-red-200 text-red-500 hover:bg-red-50 active:scale-90'
                          : 'invisible pointer-events-none'
                      }`}
                    >返品</button>
                  </div>
                </div>

                {/* ── 返品行 ── */}
                {showReturn && (
                  <div className="flex items-center px-3 py-1.5 bg-red-50 border-t border-red-100">
                    {/* ラベル */}
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="text-xs font-medium text-red-600">↩ {product.name}（返品）</span>
                    </div>

                    {/* 返品数量操作 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setReturnQty(product.id, returnQty + 1)}
                        aria-label="返品を減らす"
                        className="w-9 h-9 rounded-xl border border-red-200 text-red-400 text-xl flex items-center justify-center active:scale-90 transition-all touch-manipulation hover:bg-red-100"
                      >−</button>

                      <input
                        type="number"
                        inputMode="numeric"
                        value={returnMag === 0 ? '' : returnMag}
                        onChange={(e) => {
                          const v = e.target.value
                          setReturnQty(product.id, v === '' ? 0 : -(Math.abs(parseInt(v) || 0)))
                        }}
                        placeholder="0"
                        className="w-11 h-9 text-center text-sm font-bold rounded-xl border border-red-300 text-red-600 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                      />

                      <button
                        onClick={() => setReturnQty(product.id, returnQty - 1)}
                        aria-label="返品を増やす"
                        className="w-9 h-9 rounded-xl bg-red-500 text-white text-xl flex items-center justify-center hover:bg-red-600 active:scale-90 transition-all touch-manipulation shadow-sm"
                      >+</button>

                      {/* 返品行を削除 */}
                      <button
                        onClick={() => removeReturnRow(product.id)}
                        aria-label="返品を取消"
                        className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 text-base touch-manipulation ml-0.5"
                      >✕</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 備考欄 */}
      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">備考</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="納品希望時間・特記事項など"
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white shadow-sm"
        />
      </div>

      {/* 固定ボトムバー */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setStep('confirm')}
          disabled={totalItems === 0}
          className="w-full bg-blue-600 text-white rounded-2xl py-4 text-base font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-md touch-manipulation"
        >
          {totalItems === 0
            ? '商品を選んでください'
            : returnItems > 0 && totalItems === returnItems
            ? `発注内容を確認する（返品 ${returnItems}品目）`
            : returnItems > 0
            ? `発注内容を確認する（${totalItems - returnItems}品目 ＋ 返品${returnItems}品目）`
            : `発注内容を確認する（${totalItems}品目）`}
        </button>
      </div>
    </div>
  )
}
