'use client'

import Link from 'next/link'
import { Order } from '@/types'

export default function OrderDetailClient({ order }: { order: Order }) {
  const partner = order.partner as { name: string } | undefined
  const items = order.order_items ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

  const handlePrint = () => {
    const partnerName = partner?.name ?? ''
    const orderDateStr = formatDate(order.order_date)
    const receivedStr = formatDateTime(order.created_at)
    const ROWS_PER_PAGE = 28
    const totalPages = Math.ceil(Math.max(items.length, 5) / ROWS_PER_PAGE)

    // ページ区切りを tbody 内に「colspan行」で挿入する形式に変更
    const itemRows = items.map((item, idx) => {
      const p = item.product as { name: string; spec: string | null; price: number | null } | undefined
      const qty = item.case_qty && item.case_qty > 0 ? `${item.case_qty} C/S` : `${item.unit_qty} 個`
      const price = p?.price != null ? `¥${p.price.toLocaleString()}` : '－'
      const pageNum = Math.floor(idx / ROWS_PER_PAGE) + 1
      // ページ区切り行を先頭に挿入（2ページ目以降）
      const breakRow = idx > 0 && idx % ROWS_PER_PAGE === 0
        ? `<tr style="page-break-before:always;break-before:page">
            <td colspan="4" style="border:none;padding:0">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 8px;border-bottom:1px solid #ccc;margin-bottom:4px">
                <span style="font-size:12px;color:#555;font-weight:bold">【${pageNum}ページ目】${partnerName}　御中　（続き）</span>
                <span style="font-size:11px;color:#888">${pageNum} / ${totalPages} ページ　発注日：${orderDateStr}</span>
              </div>
            </td>
           </tr>`
        : ''
      return `${breakRow}<tr>
        <td style="text-align:right;font-family:monospace">${price}</td>
        <td>${p?.name ?? ''}</td>
        <td style="color:#555">${p?.spec ?? '－'}</td>
        <td style="text-align:center;font-weight:bold">${qty}</td>
      </tr>`
    }).join('')
    const emptyRows = items.length < 5
      ? Array.from({ length: 5 - items.length }).map(() =>
          `<tr><td style="padding:10px">&nbsp;</td><td></td><td></td><td></td></tr>`
        ).join('')
      : ''
    const noteHtml = order.note
      ? `<div style="margin-top:16px;border:1px solid #ccc;padding:8px 12px;border-radius:4px"><div style="font-size:11px;color:#666;margin-bottom:4px">備考</div><div>${order.note}</div></div>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>受注書 - ${partnerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'MS PGothic', sans-serif;
      font-size: 13px;
      color: #000;
      padding: 20mm;
    }
    @page { size: A4 portrait; margin: 0; }
    @media print { body { padding: 20mm; } }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    thead tr { background: #f0f0f0; }
    th { border: 1px solid #999; padding: 6px 10px; font-weight: bold; }
    td { border: 1px solid #ccc; padding: 6px 10px; }
    .page-break { page-break-before: always; break-before: page; margin-bottom: 16px; }
    .continued-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:22px;font-weight:bold;letter-spacing:0.2em">受　注　書</div>
    <div style="font-size:12px;color:#666;margin-top:4px">かずさや観光物産</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px">
    <div style="font-size:18px;font-weight:bold;border-bottom:2px solid #000;padding-bottom:4px;min-width:200px">
      ${partnerName}　御中
    </div>
    <div style="font-size:12px;text-align:right;line-height:1.9">
      <div>発注日：${orderDateStr}</div>
      <div>受信日時：${receivedStr}</div>
      ${totalPages > 1 ? `<div style="color:#888;margin-top:2px">1 / ${totalPages} ページ</div>` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:right;width:90px">販売価格</th>
        <th style="text-align:left">商品名</th>
        <th style="text-align:left;width:110px">規格</th>
        <th style="text-align:center;width:80px">数量</th>
      </tr>
    </thead>
    <tbody>${itemRows}${emptyRows}</tbody>
  </table>
  <div style="text-align:right;margin-top:8px;font-size:12px;color:#555">合計 ${items.length} 品目</div>
  ${noteHtml}
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=800,height=1100')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* 戻るボタン（画面のみ） */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 no-print"
      >
        ← 受注一覧に戻る
      </Link>

      {/* ヘッダー（画面のみ） */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 no-print">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-800">{partner?.name}</h1>
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
            </dl>
          </div>
          <button
            onClick={handlePrint}
            className="no-print bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            🖨 受注書を印刷
          </button>
        </div>
      </div>

      {/* 受注明細テーブル（画面のみ） */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 no-print">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 w-24">販売価格</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">商品名</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">規格</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 w-24">数量</th>
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
                  <td className="px-4 py-3 text-right text-gray-700 font-mono text-sm">
                    {product?.price != null ? `¥${product.price.toLocaleString()}` : '－'}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{product?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{product?.spec ?? '－'}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-medium">{qty}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 備考（画面のみ） */}
      {order.note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 no-print">
          <div className="text-sm font-medium text-yellow-800 mb-1">その他備考</div>
          <div className="text-gray-700">{order.note}</div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* 印刷専用レイアウト */}
      {/* ══════════════════════════════════════════ */}
      <div className="print-only">
        {/* タイトル */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.1em' }}>受　注　書</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>かずさや観光物産</div>
        </div>

        {/* 取引先・日付 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '4px', minWidth: '200px' }}>
              {partner?.name}　御中
            </div>
          </div>
          <div style={{ fontSize: '12px', textAlign: 'right', lineHeight: '1.8' }}>
            <div>発注日：{formatDate(order.order_date)}</div>
            <div>受信日時：{formatDateTime(order.created_at)}</div>
          </div>
        </div>

        {/* 明細テーブル */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right', width: '90px', fontWeight: 'bold' }}>販売価格</th>
              <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>商品名</th>
              <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', width: '100px', fontWeight: 'bold' }}>規格</th>
              <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', width: '80px', fontWeight: 'bold' }}>数量</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const product = item.product as { name: string; spec: string | null; price: number | null } | undefined
              const qty = item.case_qty && item.case_qty > 0
                ? `${item.case_qty} C/S`
                : `${item.unit_qty} 個`
              return (
                <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {product?.price != null ? `¥${product.price.toLocaleString()}` : '－'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{product?.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', color: '#555' }}>{product?.spec ?? '－'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
                </tr>
              )
            })}
            {/* 空白行（最低5行まで埋める） */}
            {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}></td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}></td>
                <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計件数 */}
        <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '12px', color: '#555' }}>
          合計 {items.length} 品目
        </div>

        {/* 備考 */}
        {order.note && (
          <div style={{ marginTop: '16px', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>備考</div>
            <div style={{ fontSize: '13px' }}>{order.note}</div>
          </div>
        )}

      </div>
    </div>
  )
}
