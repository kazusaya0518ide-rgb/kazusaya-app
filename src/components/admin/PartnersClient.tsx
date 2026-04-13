'use client'

import { useState } from 'react'
import { Partner } from '@/types'

export default function PartnersClient({
  partners: initialPartners,
  lastOrders,
  assignedCounts,
}: {
  partners: Partner[]
  lastOrders: Record<string, string | null>
  assignedCounts: Record<string, number>
}) {
  const [partners, setPartners] = useState(initialPartners)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Partner | null>(null)
  const [form, setForm] = useState({ name: '', login_id: '', password: '', memo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resetForm = () => {
    setForm({ name: '', login_id: '', password: '', memo: '' })
    setEditTarget(null)
    setError('')
  }

  const openAdd = () => { resetForm(); setShowForm(true) }
  const openEdit = (p: Partner) => {
    setEditTarget(p)
    setForm({ name: p.name, login_id: p.login_id, password: '', memo: '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = editTarget ? `/api/partners/${editTarget.id}` : '/api/partners'
    const method = editTarget ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'エラーが発生しました')
      setLoading(false)
      return
    }

    const data = await res.json()
    if (editTarget) {
      setPartners((prev) => prev.map((p) => p.id === editTarget.id ? data.partner : p))
    } else {
      setPartners((prev) => [data.partner, ...prev])
    }
    setShowForm(false)
    resetForm()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/partners/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPartners((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ja-JP') : 'なし'

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-gray-800">取引先管理</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ＋ 新規登録
        </button>
      </div>

      {/* スマホ：カード表示 / PC：テーブル表示 */}
      <div className="sm:hidden space-y-3">
        {partners.length === 0 ? (
          <div className="text-center text-gray-400 py-10">取引先が登録されていません</div>
        ) : partners.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {p.login_id}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {p.is_active ? '有効' : '無効'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
              <div>
                <span className="text-xs text-gray-400">割り当て商品</span>
                <div>
                  <a href={`/admin/assignments?partner=${p.id}`} className="text-blue-600 font-medium hover:underline">
                    {assignedCounts[p.id] ?? 0}件 →
                  </a>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400">最終発注日</span>
                <div>{formatDate(lastOrders[p.id])}</div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <button
                onClick={() => openEdit(p)}
                className="text-blue-600 text-sm font-medium hover:underline min-h-0"
              >
                編集
              </button>
              <button
                onClick={() => setDeleteTarget(p)}
                className="text-red-400 text-sm font-medium hover:text-red-600 min-h-0"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PC：テーブル表示 */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {partners.length === 0 ? (
          <div className="p-10 text-center text-gray-400">取引先が登録されていません</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">取引先名</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ログインID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">割り当て商品</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">最終発注日</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状態</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">編集</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">削除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-sm">{p.login_id}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/assignments?partner=${p.id}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span className="font-medium">{assignedCounts[p.id] ?? 0}</span>
                      <span className="text-gray-400">件 →</span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(lastOrders[p.id])}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 text-sm hover:underline min-h-0"
                    >
                      編集
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="text-red-400 text-sm hover:text-red-600 hover:underline min-h-0"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 編集フォームモーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              {editTarget ? '取引先を編集' : '取引先を新規登録'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取引先名 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ログインID *</label>
                <input
                  type="text"
                  required
                  value={form.login_id}
                  onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="半角英数字"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード {editTarget ? '（変更する場合のみ入力）' : '*'}
                </label>
                <input
                  type="password"
                  required={!editTarget}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ（担当者名など）</label>
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-800 mb-2">取引先を削除しますか？</h2>
            <p className="text-sm text-gray-600 mb-1">以下の取引先を完全に削除します。</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
              <div className="font-medium text-gray-800">{deleteTarget.name}</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {deleteTarget.login_id}</div>
            </div>
            <p className="text-xs text-red-500 mb-5">この操作は元に戻せません。商品の割り当てや発注履歴も削除されます。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
