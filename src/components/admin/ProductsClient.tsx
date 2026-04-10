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
  const [csvPreview, setCsvPreview] = useState<Partial<Product>[]>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)

  const filtered = products.filter((p) => {
    if (keyword) {
      return p.name.includes(keyword) || (p.kana ?? '').includes(keyword) || p.code.includes(keyword)
    }
    return getKanaRow(p.kana) === activeKana
  })

  const startEdit = (p: Product) => {
    setEditId(p.id)
    setEditValues({ spec: p.spec, price: p.price, kana: p.kana })
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

  // CSV ファイル選択・パース
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
      // 一覧をリロード
      setProducts(imported)
      setCsvPreview([])
      setTab('list')
    }
    setCsvImporting(false)
  }

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
          <p className="text-sm text-gray-600 mb-4">
            楽一からエクスポートしたCSV（UTF-16 BE）を選択してください。
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvFile}
            className="block mb-4 text-sm text-gray-600"
          />
          {csvLoading && <div className="text-sm text-gray-500">読み込み中...</div>}
          {csvPreview.length > 0 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-2">
                {csvPreview.length}件のプレビュー
              </div>
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
                          {p.kana ? (
                            <span className="bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-xs">{p.kana}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">未入力</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleCsvImport}
                disabled={csvImporting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
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
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワード検索（商品名・かな・コード）"
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {!keyword && (
              <div className="flex flex-wrap gap-1">
                {KANA_ROWS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveKana(k)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activeKana === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">商品がありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">規格</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">価格</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">かな</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {editId === p.id ? (
                          <input
                            value={editValues.spec ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, spec: e.target.value })}
                            className="border rounded px-2 py-1 text-sm w-24"
                          />
                        ) : (p.spec ?? '－')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">
                        {editId === p.id ? (
                          <input
                            type="number"
                            value={editValues.price ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, price: parseInt(e.target.value) || null })}
                            className="border rounded px-2 py-1 text-sm w-20 text-right"
                          />
                        ) : (p.price != null ? `${p.price.toLocaleString()}円` : '－')}
                      </td>
                      <td className="px-4 py-2.5">
                        {editId === p.id ? (
                          <input
                            value={editValues.kana ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, kana: e.target.value })}
                            className="border rounded px-2 py-1 text-sm w-28"
                            placeholder="ひらがな"
                          />
                        ) : p.kana ? (
                          <span className="text-blue-600 text-sm">{p.kana}</span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">未入力</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {editId === p.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(p.id)}
                              disabled={saving}
                              className="text-blue-600 text-sm hover:underline disabled:opacity-50 min-h-0"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-gray-400 text-sm hover:underline min-h-0"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="text-blue-600 text-sm hover:underline min-h-0"
                          >
                            編集
                          </button>
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
    </div>
  )
}
