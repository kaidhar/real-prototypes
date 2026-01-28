export interface Product {
  id: string
  title: string
  price: number
  originalPrice: number
  rating: number
  reviewCount: number
  image: string
  isPrime: boolean
  category?: string
  brand?: string
}

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  products?: Product[]
  actions?: MessageAction[]
}

export interface MessageAction {
  label: string
  action: string
  data?: any
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  product: Product
  quantity: number
  status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: Date
  estimatedDelivery: Date
}
