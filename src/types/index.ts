export type Admin = {
  id: string
  auth_user_id: string
  name: string | null
  is_active: boolean
  created_at: string
}

export type Partner = {
  id: string
  auth_user_id: string
  name: string
  login_id: string
  email: string | null
  is_active: boolean
  created_at: string
}

export type Product = {
  id: string
  code: string
  name: string
  spec: string | null
  price: number | null
  kana: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PartnerProduct = {
  id: string
  partner_id: string
  product_id: string
  display_order: number
  created_at: string
  product?: Product
}

export type Order = {
  id: string
  partner_id: string
  order_date: string
  note: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  partner?: Partner
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  case_qty: number
  unit_qty: number
  product?: Product
}

export type CartItem = {
  product: Product
  case_qty: number
  unit_qty: number
}
