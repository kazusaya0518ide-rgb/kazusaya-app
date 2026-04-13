'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'

type PartnerBasic = { id: string; name: string }
type ProductBasic = Pick<Product, 'id' | 'name' | 'spec' | 'kana' | 'price'>

const KANA_ROWS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'その他']

function getKanaRow(kana: string | null): string {
  if (!kana) return 'その他'
  const c = kana[0]
  if ('あいうえお'.includes(c)) return 'あ'
  if ('かきくけこ'.includes(c)) return 'か'
  if ('さしすせそ'.includes(c)) return 'さ'
  if ('たちつてと'.includes(c)) return 'た'
  if ('なにぬねの'.includes(c)) return 'な'
  if ('はひふへほ'.includes(c)) return 'は'
  if ('まみむめも'.includes(c)) return 'ま'
  if ('やゆよ'.includes(c)) return 'や'
  if ('らりるれろ'.includes(c)) return 'ら'
  if ('わをん'.includes(c)) return 'わ'
  return 'その他'
}

function PriceTag({ price }: { price: number | null }) {
  if (!price) return null
  return (
    <span className="text-xs text-gray-500 font-mono shrink-0 w-16 text-right">
      ¥{price.toLocaleString()}
    </span>
  )
}

export default function AssignmentsClient({
  partners,
  allProducts,
  initialPartnerId = '',
}: {
  partners: PartnerBasic[]
  allProducts: ProductBasic[]
  initialPartnerId?: string
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId)
  const [assigned, setAssigned] = useState<(ProductBasic & { pp_id: string })[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeKana, setActiveKana] = useState('あ')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedPartnerId) return
    setLoading(true)
    fetch(`/api/assignments/${selectedPartnerId}`)
      .then((r) => r.json())
      .then(({ assigned }) => {
        setAssigned(assigned ?? [])
        setLoading(false)
      })
  }, [selectedPartnerId])

  const assignedIds = new Set(assigned.map((a) => a.id))

  const unassigned = allProducts.filter((p) => !assignedIds.has(p.id))
  const filtered = unassigned.filter((p) => {
    if (keyword) return p.name.includes(keyword) || (p.kana ?? '').includes(keyword)
    return getKanaRow(p.kana) === activeKana
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const addSelected = async () => {
    if (!selectedPartnerId || selectedIds.size === 0) return
    const res = await fetch(`/api/assignments/${selectedPartnerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: Array.from(selectedIds) }),
    })
    if (res.ok) {
      const { assigned: newAssigned } = await res.json()
      setAssigned(newAssigned)
      setSelectedIds(new Set())
    }
  }

  const removeAssigned = async (ppId: string) => {
    const res = await fetch(`/api/assignments/item/${ppId}`, { method: 'DELETE' })
    if (res.ok) {
      setAssigned((prev) => prev.filter((a) => a.pp_id !== ppId))
    }
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const next = [...assigned]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setAssigned(next)
    await saveOrder(next)
  }

  const moveDown = async (index: number) => {
    if (index === assigned.length - 1) return
    const next = [...assigned]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setAssigned(next)
    await saveOrder(next)
  }

  const saveOrder = async (items: typeof assigned) => {
    await fetch(`/api/assignments/${selectedPartnerId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: items.map((a, i) => ({ pp_id: a.pp_id, display_order: i })) }),
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-5">商品割り当て</h1>

      {/* 取引先選択 */}
      <div className="mb-5">
        <select
          value={selectedPartnerId}
          onChange={(e) => setSelectedPartnerId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">取引先を選択...</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedPartnerId && (
        <div className="flex gap-4">
          {/* 左：全商品（未割り当て） */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="font-medium text-gray-700 mb-3">全商品から選択</div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワード検索"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!keyword && (
              <div className="flex flex-wrap gap-1 mb-3">
                {KANA_ROWS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveKana(k)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${activeKana === k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <PriceTag price={p.price} />
                  <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                  {p.spec && <span className="text-xs text-gray-400 shrink-0">{p.spec}</span>}
                </label>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-gray-400 py-4 text-center">該当する商品がありません</div>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={addSelected}
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                選択した{selectedIds.size}件を追加 →
              </button>
            )}
          </div>

          {/* 右：割り当て済み */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="font-medium text-gray-700 mb-3">
              割り当て済み（{assigned.length}件）
            </div>
            {loading ? (
              <div className="text-sm text-gray-400 py-4 text-center">読み込み中...</div>
            ) : assigned.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">商品を追加してください</div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                {assigned.map((p, idx) => (
                  <div key={p.pp_id} className="flex items-center gap-2 py-2 px-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 text-xs leading-none min-h-0 min-w-0">▲</button>
                      <button onClick={() => moveDown(idx)} disabled={idx === assigned.length - 1} className="text-gray-300 hover:text-gray-600 text-xs leading-none min-h-0 min-w-0">▼</button>
                    </div>
                    <span className="text-sm text-gray-500 w-6 text-right shrink-0">{idx + 1}</span>
                    <PriceTag price={p.price} />
                    <span className="flex-1 text-sm text-gray-800">{p.name}</span>
                    {p.spec && <span className="text-xs text-gray-400 shrink-0">{p.spec}</span>}
                    <button
                      onClick={() => removeAssigned(p.pp_id)}
                      className="text-red-400 text-xs hover:text-red-600 min-h-0 min-w-0 shrink-0"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
