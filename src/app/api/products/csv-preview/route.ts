import { NextResponse } from 'next/server'

// UTF-16 BE / UTF-16 LE / UTF-8 / Shift-JIS CSVをパースして商品データに変換
function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

// 商品コードがない場合、商品名から安定したコードを生成
function makeCodeFromName(name: string): string {
  return name.replace(/[\s\u3000]/g, '').substring(0, 50)
}

// エンコーディング検出＆デコード
function decodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)

  // UTF-16 BE BOM: FE FF
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return new TextDecoder('utf-16be').decode(buffer.slice(2))
  }
  // UTF-16 LE BOM: FF FE
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return new TextDecoder('utf-16le').decode(buffer.slice(2))
  }

  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(buffer.slice(3))
  }

  // UTF-8 を試みてU+FFFDが多ければShift-JISにフォールバック
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  const replacements = (utf8.match(/\uFFFD/g) ?? []).length
  if (replacements > 5) {
    // Shift-JIS（Windows-31J / CP932）
    try {
      return new TextDecoder('shift_jis').decode(buffer)
    } catch {
      return utf8
    }
  }

  return utf8
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const text = decodeBuffer(buffer)
  const rows = parseCsvText(text)

  // 列名マッピング（楽一CSV各種フォーマットに対応）
  // かな列：「かな」→「商品名フリガナ」の順で探す
  // 規格列：「規格」→「商品名２」の順で探す
  const items = rows
    .filter((r) => (r['商品コード'] || r['code'] || r['商品名'] || r['name']))
    .map((r) => {
      const name = r['商品名'] ?? r['name'] ?? ''
      const rawCode = r['商品コード'] ?? r['code'] ?? ''
      const code = rawCode || makeCodeFromName(name)
      const spec = r['規格'] ?? r['spec'] ?? r['商品名２'] ?? null
      const kana = r['かな'] ?? r['kana'] ?? r['商品名フリガナ'] ?? null
      return {
        code,
        name,
        spec: spec || null,
        price: parseInt(r['税抜上代単価１'] ?? r['price'] ?? '') || null,
        kana: kana || null,
      }
    })
    .filter((i) => i.code && i.name)

  return NextResponse.json({ items })
}
