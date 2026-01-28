'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Minus, ShoppingCart, Package, Search, Filter, History, TrendingUp } from 'lucide-react'
import ProductCard from './ProductCard'
import { Message, Product, Order, CartItem } from './types'

// Amazon design tokens
const colors = {
  navbar: '#131921',
  navbarHover: '#232F3E',
  orange: '#FF9900',
  orangeHover: '#FA8900',
  textPrimary: '#0F1111',
  textSecondary: '#565959',
  link: '#007185',
  white: '#FFFFFF',
  bgLight: '#F0F2F2',
  bgGray: '#EAEDED',
  border: '#DDD',
  buttonYellow: '#FFD814',
  buttonYellowHover: '#F7CA00',
  success: '#067D62',
  error: '#CC0C39',
}

interface ChatbotWindowProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  onCartUpdate?: (count: number) => void
}

// Comprehensive product database
const productDatabase: Product[] = [
  // Headphones
  {
    id: '1',
    title: 'boAt Rockerz 450 Bluetooth On Ear Headphones with Mic',
    price: 1299,
    originalPrice: 2990,
    rating: 4.1,
    reviewCount: 125847,
    image: 'https://m.media-amazon.com/images/I/61Kw4kSkAkL._SL1500_.jpg',
    isPrime: true,
    category: 'headphones',
    brand: 'boAt',
  },
  {
    id: '2',
    title: 'Sony WH-1000XM4 Industry Leading Wireless Noise Cancellation',
    price: 19990,
    originalPrice: 29990,
    rating: 4.5,
    reviewCount: 32156,
    image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._SL1500_.jpg',
    isPrime: true,
    category: 'headphones',
    brand: 'Sony',
  },
  {
    id: '3',
    title: 'JBL Tune 760NC Wireless Over-Ear NC Headphones',
    price: 4999,
    originalPrice: 9999,
    rating: 4.3,
    reviewCount: 8542,
    image: 'https://m.media-amazon.com/images/I/61fSaBnKkpL._SL1500_.jpg',
    isPrime: true,
    category: 'headphones',
    brand: 'JBL',
  },
  // Laptops
  {
    id: '4',
    title: 'HP 15s Ryzen 5 5500U 15.6 inch FHD Laptop (8GB RAM/512GB SSD)',
    price: 42990,
    originalPrice: 59990,
    rating: 4.2,
    reviewCount: 8945,
    image: 'https://m.media-amazon.com/images/I/71vCKMqq6jL._SL1500_.jpg',
    isPrime: true,
    category: 'laptop',
    brand: 'HP',
  },
  {
    id: '5',
    title: 'Dell 14 Thin & Light Laptop, Intel Core i3-1115G4 (8GB/512GB SSD)',
    price: 38490,
    originalPrice: 49990,
    rating: 4.3,
    reviewCount: 12456,
    image: 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg',
    isPrime: true,
    category: 'laptop',
    brand: 'Dell',
  },
  {
    id: '6',
    title: 'Lenovo IdeaPad Slim 3 Intel Core i5 12th Gen 15.6" FHD Laptop',
    price: 49990,
    originalPrice: 64990,
    rating: 4.4,
    reviewCount: 6789,
    image: 'https://m.media-amazon.com/images/I/61nmC5JgIjL._SL1500_.jpg',
    isPrime: true,
    category: 'laptop',
    brand: 'Lenovo',
  },
  // Phones
  {
    id: '7',
    title: 'Samsung Galaxy M14 5G (Smoky Black, 6GB RAM, 128GB Storage)',
    price: 12990,
    originalPrice: 18490,
    rating: 4.0,
    reviewCount: 15234,
    image: 'https://m.media-amazon.com/images/I/81qxVEVFMPL._SL1500_.jpg',
    isPrime: true,
    category: 'phone',
    brand: 'Samsung',
  },
  {
    id: '8',
    title: 'OnePlus Nord CE 3 Lite 5G (Pastel Lime, 8GB RAM, 128GB Storage)',
    price: 17999,
    originalPrice: 21999,
    rating: 4.2,
    reviewCount: 9876,
    image: 'https://m.media-amazon.com/images/I/61QRgOgBpML._SL1500_.jpg',
    isPrime: true,
    category: 'phone',
    brand: 'OnePlus',
  },
  {
    id: '9',
    title: 'Redmi 12 5G Moonstone Silver 8GB RAM 256GB ROM',
    price: 14999,
    originalPrice: 19999,
    rating: 4.1,
    reviewCount: 11234,
    image: 'https://m.media-amazon.com/images/I/71d1ytcCntL._SL1500_.jpg',
    isPrime: true,
    category: 'phone',
    brand: 'Redmi',
  },
  // Smartwatches
  {
    id: '10',
    title: 'Fire-Boltt Phoenix Ultra Luxury Stainless Steel Bluetooth Calling Smartwatch',
    price: 2499,
    originalPrice: 7999,
    rating: 4.0,
    reviewCount: 45678,
    image: 'https://m.media-amazon.com/images/I/61PoVgh37CL._SL1500_.jpg',
    isPrime: true,
    category: 'watch',
    brand: 'Fire-Boltt',
  },
  {
    id: '11',
    title: 'Noise Pulse 2 Max 1.85" Display, Bluetooth Calling Smart Watch',
    price: 2999,
    originalPrice: 5999,
    rating: 4.1,
    reviewCount: 23456,
    image: 'https://m.media-amazon.com/images/I/61sFD9zJNlL._SL1500_.jpg',
    isPrime: true,
    category: 'watch',
    brand: 'Noise',
  },
]

export default function ChatbotWindow({ isOpen, onClose, onMinimize, onCartUpdate }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your Amazon Shopping Assistant. I can help you find products, track orders, and manage your cart. What are you looking for today?',
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [view, setView] = useState<'chat' | 'cart' | 'orders'>('chat')
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (onCartUpdate) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
      onCartUpdate(totalItems)
    }
  }, [cart, onCartUpdate])

  // Smart search function
  const searchProducts = (query: string, customPriceFilter?: { min: number; max: number } | null): Product[] => {
    const lowerQuery = query.toLowerCase()

    // Category keywords mapping
    const categoryMap: Record<string, string> = {
      'headphone': 'headphones',
      'earphone': 'headphones',
      'audio': 'headphones',
      'laptop': 'laptop',
      'computer': 'laptop',
      'notebook': 'laptop',
      'phone': 'phone',
      'mobile': 'phone',
      'smartphone': 'phone',
      'watch': 'watch',
      'smartwatch': 'watch',
      'wearable': 'watch',
    }

    // Find category match
    let category: string | null = null
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (lowerQuery.includes(keyword)) {
        category = cat
        break
      }
    }

    // Use custom price filter if provided, otherwise use state
    const activeFilter = customPriceFilter !== undefined ? customPriceFilter : priceFilter

    let results = productDatabase.filter(product => {
      // Search in title, brand, and category
      const matchesQuery =
        product.title.toLowerCase().includes(lowerQuery) ||
        product.brand?.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery)

      // Filter by category if found
      const matchesCategory = !category || product.category === category

      // Filter by price if set
      const matchesPrice = !activeFilter ||
        (product.price >= activeFilter.min && product.price <= activeFilter.max)

      return matchesQuery && matchesCategory && matchesPrice
    })

    // Sort by relevance (rating × review count)
    results.sort((a, b) => {
      const scoreA = a.rating * Math.log(a.reviewCount + 1)
      const scoreB = b.rating * Math.log(b.reviewCount + 1)
      return scoreB - scoreA
    })

    return results.slice(0, 5)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const query = inputValue
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      // Check for special commands
      if (query.toLowerCase().includes('track') || query.toLowerCase().includes('order')) {
        handleTrackOrder()
      } else if (query.toLowerCase().includes('cart')) {
        handleViewCart()
      } else if (query.toLowerCase().includes('cheap') || query.toLowerCase().includes('under')) {
        // Extract price from query
        const priceMatch = query.match(/\d+/)
        let tempFilter = null
        if (priceMatch) {
          const maxPrice = parseInt(priceMatch[0])
          tempFilter = { min: 0, max: maxPrice }
          setPriceFilter(tempFilter)
        }
        const products = searchProducts(query, tempFilter)
        showProducts(query, products)
      } else {
        // Regular search
        const products = searchProducts(query)
        showProducts(query, products)
      }
      setIsTyping(false)
    }, 1000)
  }

  const showProducts = (query: string, products: Product[]) => {
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: products.length > 0
        ? `I found ${products.length} great options for "${query}". Here are the top picks:`
        : `Sorry, I couldn't find any products matching "${query}". Try searching for headphones, laptops, phones, or smartwatches!`,
      timestamp: new Date(),
      products: products.length > 0 ? products : undefined,
    }
    setMessages(prev => [...prev, botResponse])
  }

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    const confirmMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `✓ Added "${product.title}" to your cart! You now have ${cart.reduce((sum, item) => sum + item.quantity, 0) + 1} items. Would you like to view cart or continue shopping?`,
      timestamp: new Date(),
      actions: [
        { label: 'View Cart', action: 'view_cart' },
        { label: 'Continue Shopping', action: 'continue' },
      ],
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleBuyNow = (product: Product) => {
    // Add to cart first
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    const confirmMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Processing checkout for "${product.title}" at ₹${product.price.toLocaleString()}...\n\n📍 **Delivery Address**\nBengaluru 562130\n\n💳 **Payment Method**\nCash on Delivery / UPI / Card\n\nExpected delivery: 2-3 days\nTotal: ₹${product.price.toLocaleString()}`,
      timestamp: new Date(),
      actions: [
        { label: 'Confirm Order', action: 'confirm_order', data: product },
        { label: 'Cancel', action: 'cancel' },
      ],
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleConfirmOrder = (product: Product) => {
    const orderId = `ORD${Date.now().toString().slice(-8)}`
    const order: Order = {
      id: orderId,
      product,
      quantity: 1,
      status: 'confirmed',
      orderDate: new Date(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    }
    setOrders(prev => [...prev, order])

    const confirmMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🎉 Order confirmed!\n\n**Order ID:** ${orderId}\n**Product:** ${product.title}\n**Amount:** ₹${product.price.toLocaleString()}\n**Expected Delivery:** ${order.estimatedDelivery.toLocaleDateString()}\n\nYou can track your order anytime by clicking "Track Order" or saying "track my order"!`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleViewCart = () => {
    if (cart.length === 0) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '🛒 Your cart is empty. Would you like to browse some products?',
        timestamp: new Date(),
        actions: [
          { label: 'Browse Laptops', action: 'search', data: 'laptop' },
          { label: 'Browse Phones', action: 'search', data: 'phone' },
          { label: 'Browse Headphones', action: 'search', data: 'headphones' },
        ],
      }
      setMessages(prev => [...prev, message])
      return
    }

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const cartItems = cart.map(item =>
      `• ${item.product.title.slice(0, 50)}... (₹${item.product.price.toLocaleString()} × ${item.quantity})`
    ).join('\n')

    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🛒 **Your Cart (${cart.length} items)**\n\n${cartItems}\n\n**Total:** ₹${total.toLocaleString()}`,
      timestamp: new Date(),
      actions: [
        { label: 'Proceed to Checkout', action: 'checkout' },
        { label: 'Clear Cart', action: 'clear_cart' },
      ],
    }
    setMessages(prev => [...prev, message])
  }

  const handleTrackOrder = () => {
    if (orders.length === 0) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '📦 You don\'t have any orders yet. Place your first order to start tracking!',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, message])
      return
    }

    const orderList = orders.map(order => {
      const statusEmoji = order.status === 'confirmed' ? '✓' :
        order.status === 'shipped' ? '🚚' :
        order.status === 'delivered' ? '📦' : '⏳'
      return `${statusEmoji} **${order.id}**\n   ${order.product.title.slice(0, 40)}...\n   Status: ${order.status.toUpperCase()}\n   Delivery: ${order.estimatedDelivery.toLocaleDateString()}`
    }).join('\n\n')

    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `📦 **Your Orders**\n\n${orderList}`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, message])
  }

  const handleQuickAction = (action: string) => {
    if (action === 'find') {
      const message: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '🔍 What are you looking for? Try:\n• "laptop under 50000"\n• "wireless headphones"\n• "5G phones"\n• "smartwatch"',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, message])
    } else if (action === 'track') {
      handleTrackOrder()
    }
  }

  const handleActionClick = (action: string, data?: any) => {
    switch (action) {
      case 'view_cart':
        handleViewCart()
        break
      case 'continue':
        const message: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: 'Great! What else would you like to search for?',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, message])
        break
      case 'confirm_order':
        if (data) handleConfirmOrder(data)
        break
      case 'cancel':
        const cancelMsg: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: 'Order cancelled. Feel free to continue browsing!',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, cancelMsg])
        break
      case 'search':
        if (data) {
          const products = searchProducts(data)
          showProducts(data, products)
        }
        break
      case 'checkout':
        const checkoutMsg: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: '🎉 Proceeding to checkout... Select payment method:\n\n• Cash on Delivery\n• UPI\n• Credit/Debit Card\n• Net Banking',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, checkoutMsg])
        break
      case 'clear_cart':
        setCart([])
        const clearMsg: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: '✓ Cart cleared! Ready to start fresh shopping?',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, clearMsg])
        break
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '420px',
        height: '600px',
        backgroundColor: colors.white,
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.navbar,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: colors.orange,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <ShoppingCart size={20} color={colors.white} />
            {cart.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: colors.error,
                  color: colors.white,
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ color: colors.white, fontWeight: 'bold', fontSize: '14px' }}>
              Shopping Assistant
            </div>
            <div style={{ color: '#999', fontSize: '11px' }}>
              Powered by Amazon
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onMinimize}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Minimize"
          >
            <Minus size={18} color={colors.white} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <X size={18} color={colors.white} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: colors.navbarHover,
          padding: '8px 16px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={() => handleQuickAction('find')}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${colors.orange}`,
            borderRadius: '16px',
            padding: '4px 12px',
            color: colors.orange,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Search size={12} /> Find Products
        </button>
        <button
          onClick={() => handleQuickAction('track')}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${colors.orange}`,
            borderRadius: '16px',
            padding: '4px 12px',
            color: colors.orange,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Package size={12} /> Track Order
        </button>
      </div>

      {/* Messages */}
      <div
        className="chatbot-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: colors.bgLight,
        }}
      >
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: message.type === 'user' ? colors.navbar : colors.white,
                  color: message.type === 'user' ? colors.white : colors.textPrimary,
                  fontSize: '14px',
                  lineHeight: '1.4',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-line',
                }}
              >
                {message.content}
              </div>
            </div>

            {/* Action Buttons */}
            {message.actions && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {message.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(action.action, action.data)}
                    style={{
                      backgroundColor: colors.buttonYellow,
                      border: '1px solid #F2C200',
                      borderRadius: '16px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: colors.textPrimary,
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Product Cards */}
            {message.products && (
              <div style={{ marginTop: '12px' }}>
                {message.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onBuyNow={() => handleBuyNow(product)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                backgroundColor: colors.white,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.orange,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0s',
                }} />
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.orange,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.2s',
                }} />
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.orange,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.4s',
                }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: colors.white,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: colors.bgLight,
            borderRadius: '24px',
            padding: '4px 4px 4px 16px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for products..."
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              outline: 'none',
              color: colors.textPrimary,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: inputValue.trim() ? colors.orange : '#CCC',
              border: 'none',
              cursor: inputValue.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            aria-label="Send message"
          >
            <Send size={18} color={colors.white} />
          </button>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
