'use client'

import { useState } from 'react'
import { Product } from '@/types'

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

export default function ProductsClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial)
  const [tab, setTab] = useState<'csv' | 'list'>('list')
  const [activeKana, setActiveKana] = useState('あ')
  const [keyword, setKeyword] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)

  // 単体削除
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 一括削除
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [csvPreview, setCsvPreview] = useState<Partial<Product>[]>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)

  const filtered = products.filter((p) => {
    if (keyword) return p.name.includes(keyword) || (p.kana ?? '').includes(keyword) || p.code.includes(keyword)
    return getKanaRow(p.kana) === activeKana
  })

  const allChecked = filtered.length > 0 && filtered.every((p) => checkedIds.has(p.id))
  const someChecked = filtered.some((p) => checkedIds.has(p.id))

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const toggleOne = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const startEdit = (p: Product) => {
    setEditId(p.id)
    setEditValues({ name: p.name, spec: p.spec, price: p.price, kana: p.kana })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editValues),
    })
    if (res.ok) {
      const { product } = await res.json()
      setProducts((prev) => prev.map((p) => p.id === id ? product : p))
    }
    setEditId(null)
    setSaving(false)
  }

  // 単体削除
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setCheckedIds((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next })
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  // 一括削除
  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    const ids = Array.from(checkedIds)
    const res = await fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => !checkedIds.has(p.id)))
      setCheckedIds(new Set())
    }
    setShowBulkConfirm(false)
    setBulkDeleting(false)
  }

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvLoading(true)
    const res = await fetch('/api/products/csv-preview', {
      method: 'POST',
      body: (() => { const fd = new FormData(); fd.append('file', file); return fd })(),
    })
    if (res.ok) {
      const { items } = await res.json()
      setCsvPreview(items)
    }
    setCsvLoading(false)
  }

  const handleCsvImport = async () => {
    setCsvImporting(true)
    const res = await fetch('/api/products/csv-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: csvPreview }),
    })
    if (res.ok) {
      const { products: imported } = await res.json()
      setProducts(imported)
      setCsvPreview([])
      setTab('list')
    }
    setCsvImporting(false)
  }

  const checkedCount = checkedIds.size

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-5">商品マスタ管理</h1>

      {/* タブ */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          商品一覧・編集
        </button>
        <button
          onClick={() => setTab('csv')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'csv' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          CSV取り込み
        </button>
      </div>

      {tab === 'csv' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-600 mb-4">楽一からエクスポートしたCSV（UTF-16 BE）を選択してください。</p>
          <input type="file" accept=".csv" onChange={handleCsvFile} className="block mb-4 text-sm text-gray-600" />
          {csvLoading && <div className="text-sm text-gray-500">読み込み中...</div>}
          {csvPreview.length > 0 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-2">{csvPreview.length}件のプレビュー</div>
              <div className="overflow-x-auto mb-4 border rounded-lg max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">コード</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">商品名</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">規格</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">価格</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">かな</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvPreview.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 font-mono text-gray-600">{p.code}</td>
                        <td className="px-3 py-1.5">{p.name}</td>
                        <td className="px-3 py-1.5 text-gray-500">{p.spec ?? '－'}</td>
                        <td className="px-3 py-1.5 text-right">{p.price ?? '－'}</td>
                        <td className="px-3 py-1.5 text-blue-600">
                          {p.kana
                            ? <span className="bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-xs">{p.kana}</span>
                            : <span className="text-gray-300 text-xs">未入力</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleCsvImport} disabled={csvImporting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {csvImporting ? '取り込み中...' : 'この内容で取り込む'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'list' && (
        <>
          {/* 検索・かな絞り込み */}
          <div className="mb-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCheckedIds(new Set()) }}
              placeholder="キーワード検索（商品名・かな・コード）"
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {!keyword && (
              <div className="flex flex-wrap gap-1">
                {KANA_ROWS.map((k) => (
                  <button key={k} onClick={() => { setActiveKana(k); setCheckedIds(new Set()) }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activeKana === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}>
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 一括削除バー */}
          {checkedCount > 0 && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-3">
              <span className="text-sm text-red-700 font-medium">{checkedCount}件を選択中</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setCheckedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700 min-h-0">
                  選択解除
                </button>
                <button
                  onClick={() => setShowBulkConfirm(true)}
                  className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-600 font-medium min-h-0"
                >
                  まとめて削除
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">商品がありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                        onChange={toggleAll}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">規格</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">価格</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">かな</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className={checkedIds.has(p.id) ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={checkedIds.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                        {editId === p.id
                          ? <input value={editValues.name ?? ''} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="border rounded px-2 py-1 text-sm w-48" />
                          : p.name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {editId === p.id
                          ? <input value={editValues.spec ?? ''} onChange={(e) => setEditValues({ ...editValues, spec: e.target.value })} className="border rounded px-2 py-1 text-sm w-24" />
                          : (p.spec ?? '－')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">
                        {editId === p.id
                          ? <input type="number" value={editValues.price ?? ''} onChange={(e) => setEditValues({ ...editValues, price: parseInt(e.target.value) || null })} className="border rounded px-2 py-1 text-sm w-20 text-right" />
                          : (p.price != null ? `${p.price.toLocaleString()}円` : '－')}
                      </td>
                      <td className="px-4 py-2.5">
                        {editId === p.id
                          ? <input value={editValues.kana ?? ''} onChange={(e) => setEditValues({ ...editValues, kana: e.target.value })} className="border rounded px-2 py-1 text-sm w-28" placeholder="ひらがな" />
                          : p.kana
                            ? <span className="text-blue-600 text-sm">{p.kana}</span>
                            : <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">未入力</span>}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {editId === p.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(p.id)} disabled={saving} className="text-blue-600 text-sm hover:underline disabled:opacity-50 min-h-0">保存</button>
                            <button onClick={() => setEditId(null)} className="text-gray-400 text-sm hover:underline min-h-0">取消</button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(p)} className="text-blue-600 text-sm hover:underline min-h-0">編集</button>
                            <button onClick={() => setDeleteTarget(p)} className="text-red-400 text-sm hover:text-red-600 hover:underline min-h-0">削除</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* 単体削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-800 mb-2">商品を削除しますか？</h2>
            <p className="text-sm text-gray-600 mb-1">以下の商品を完全に削除します。</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
              <div className="font-medium text-gray-800 text-sm">{deleteTarget.name}</div>
              {deleteTarget.spec && <div className="text-xs text-gray-500 mt-0.5">{deleteTarget.spec}</div>}
            </div>
            <p className="text-xs text-red-500 mb-5">この操作は元に戻せません。取引先への割り当ても同時に削除されます。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200">キャンセル</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括削除確認モーダル */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-800 mb-2">一括削除しますか？</h2>
            <div className="bg-red-50 rounded-lg px-4 py-3 mb-3 text-center">
              <span className="text-2xl font-bold text-red-600">{checkedCount}</span>
              <span className="text-sm text-red-700 ml-1">件の商品</span>
            </div>
            <p className="text-xs text-red-500 mb-5">この操作は元に戻せません。選択した全商品と取引先への割り当てが削除されます。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200">キャンセル</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting} className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {bulkDeleting ? '削除中...' : `${checkedCount}件を削除する`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
