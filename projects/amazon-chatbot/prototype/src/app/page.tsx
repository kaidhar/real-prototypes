'use client'

import React, { useState } from 'react'
import { Search, ShoppingCart, MapPin, ChevronDown, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { ChatbotWindow, ChatbotButton } from '@/components/chatbot'

// Amazon design tokens
const colors = {
  navbar: '#131921',
  navbarHover: '#232F3E',
  subNav: '#232F3E',
  orange: '#FF9900',
  textPrimary: '#0F1111',
  textSecondary: '#565959',
  link: '#007185',
  white: '#FFFFFF',
  bgLight: '#F0F2F2',
  bgGray: '#EAEDED',
  border: '#DDD',
  buttonYellow: '#FFD814',
}

// Category card data with emoji icons and colors
const categoryCards = [
  {
    title: 'Deals on Electronics',
    items: [
      { label: 'Up to 45% off | Laptops', emoji: '💻', bgColor: '#E3F2FD' },
      { label: 'Up to 60% off | Headphones', emoji: '🎧', bgColor: '#F3E5F5' },
      { label: 'Up to 50% off | Cameras', emoji: '📷', bgColor: '#E8F5E9' },
      { label: 'Up to 40% off | Speakers', emoji: '🔊', bgColor: '#FFF3E0' },
    ],
  },
  {
    title: 'Revamp your home in style',
    items: [
      { label: 'Cushion covers & more', emoji: '🛋️', bgColor: '#FCE4EC' },
      { label: 'Figurines & vases', emoji: '🏺', bgColor: '#E0F7FA' },
      { label: 'Home storage', emoji: '📦', bgColor: '#FFF8E1' },
      { label: 'Lighting solutions', emoji: '💡', bgColor: '#FFFDE7' },
    ],
  },
  {
    title: 'Appliances for your home | Up to 55% off',
    items: [
      { label: 'Air conditioners', emoji: '❄️', bgColor: '#E1F5FE' },
      { label: 'Refrigerators', emoji: '🧊', bgColor: '#E8EAF6' },
      { label: 'Microwaves', emoji: '📻', bgColor: '#ECEFF1' },
      { label: 'Washing machines', emoji: '🧺', bgColor: '#F1F8E9' },
    ],
  },
  {
    title: 'Starting ₹49 | Deals on home essentials',
    items: [
      { label: 'Cleaning supplies', emoji: '🧹', bgColor: '#E0F2F1' },
      { label: 'Bathroom accessories', emoji: '🚿', bgColor: '#F3E5F5' },
      { label: 'Home tools', emoji: '🔧', bgColor: '#EFEBE9' },
      { label: 'Kitchen essentials', emoji: '🍳', bgColor: '#FBE9E7' },
    ],
  },
]

// Hero banner slides
const heroBanners = [
  {
    title: 'Starting ₹99',
    subtitle: 'Bottles & lunch boxes',
    bgColor: '#E8D5B7',
    emoji: '🍱',
  },
  {
    title: 'Up to 70% off',
    subtitle: 'Fashion & Accessories',
    bgColor: '#FFE4E1',
    emoji: '👗',
  },
  {
    title: 'New Arrivals',
    subtitle: 'Electronics & Gadgets',
    bgColor: '#E0F0FF',
    emoji: '📱',
  },
]

// Carousel products with emojis
const carouselProducts = [
  { title: 'Bajaj Pulsar', price: '₹70,348', emoji: '🏍️', bgColor: '#E0E0E0' },
  { title: 'Royal Enfield', price: '₹1,54,000', emoji: '🏍️', bgColor: '#BDBDBD' },
  { title: 'KTM Duke', price: '₹2,10,000', emoji: '🏍️', bgColor: '#E0E0E0' },
  { title: 'Yamaha R15', price: '₹1,82,000', emoji: '🏍️', bgColor: '#BDBDBD' },
  { title: 'Honda CB350', price: '₹1,99,000', emoji: '🏍️', bgColor: '#E0E0E0' },
]

export default function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [cartCount, setCartCount] = useState(0)

  const handleToggleChat = () => {
    if (isChatMinimized) {
      setIsChatMinimized(false)
    } else {
      setIsChatOpen(!isChatOpen)
    }
  }

  const handleMinimize = () => {
    setIsChatMinimized(true)
  }

  const handleClose = () => {
    setIsChatOpen(false)
    setIsChatMinimized(false)
  }

  const handleCartUpdate = (count: number) => {
    setCartCount(count)
  }

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % heroBanners.length)
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgGray }}>
      {/* Amazon Navbar */}
      <header>
        {/* Main Nav */}
        <div
          style={{
            backgroundColor: colors.navbar,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            <span style={{ color: colors.white, fontWeight: 'bold', fontSize: '24px' }}>
              amazon
            </span>
            <span style={{ color: colors.orange, fontSize: '14px' }}>.in</span>
          </div>

          {/* Location */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            <MapPin size={18} color={colors.white} />
            <div>
              <div style={{ color: '#CCC', fontSize: '11px' }}>Delivering to</div>
              <div style={{ color: colors.white, fontSize: '13px', fontWeight: 'bold' }}>
                Bengaluru 562130
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'stretch',
              height: '40px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: '#E6E6E6',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: colors.textSecondary,
                borderRight: '1px solid #CDCDCD',
              }}
            >
              All <ChevronDown size={14} />
            </div>
            <input
              type="text"
              placeholder="Search Amazon.in"
              style={{
                flex: 1,
                border: 'none',
                padding: '0 12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              style={{
                backgroundColor: colors.orange,
                border: 'none',
                padding: '0 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={22} color={colors.navbar} />
            </button>
          </div>

          {/* Language */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
              color: colors.white,
              fontSize: '13px',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            🇮🇳 EN <ChevronDown size={14} />
          </div>

          {/* Account */}
          <div
            style={{
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            <div style={{ color: '#CCC', fontSize: '11px' }}>Hello, sign in</div>
            <div style={{ color: colors.white, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
              Account & Lists <ChevronDown size={12} />
            </div>
          </div>

          {/* Orders */}
          <div
            style={{
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            <div style={{ color: '#CCC', fontSize: '11px' }}>Returns</div>
            <div style={{ color: colors.white, fontSize: '13px', fontWeight: 'bold' }}>
              & Orders
            </div>
          </div>

          {/* Cart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid white'
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'
            }}
          >
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={32} color={colors.white} />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '0',
                  color: colors.orange,
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {cartCount}
              </span>
            </div>
            <span style={{ color: colors.white, fontWeight: 'bold', fontSize: '13px' }}>Cart</span>
          </div>
        </div>

        {/* Sub Nav */}
        <div
          style={{
            backgroundColor: colors.subNav,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: colors.white,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '2px',
            }}
          >
            <Menu size={20} />
            <span style={{ fontWeight: 'bold' }}>All</span>
          </div>
          {['Fresh', 'MX Player', 'Sell', 'Bestsellers', "Today's Deals", 'Mobiles', 'Customer Service', 'Prime', 'Electronics', 'Fashion'].map(
            (item) => (
              <span
                key={item}
                style={{
                  color: colors.white,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '2px',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'
                }}
              >
                {item}
              </span>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Banner Carousel */}
        <div
          style={{
            position: 'relative',
            height: '350px',
            backgroundColor: heroBanners[currentBanner].bgColor,
            overflow: 'hidden',
            transition: 'background-color 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '0 80px',
              gap: '40px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: '8px' }}>
                {heroBanners[currentBanner].title}
              </h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary }}>
                {heroBanners[currentBanner].subtitle}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span style={{ backgroundColor: '#CC0C39', color: 'white', padding: '4px 8px', borderRadius: '2px', fontSize: '12px' }}>
                  Free delivery on first order
                </span>
                <span style={{ backgroundColor: colors.orange, color: 'white', padding: '4px 8px', borderRadius: '2px', fontSize: '12px' }}>
                  Up to 10% Instant Discount
                </span>
              </div>
            </div>
            <div
              style={{
                width: '350px',
                height: '250px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '100px',
              }}
            >
              {heroBanners[currentBanner].emoji}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevBanner}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '100px',
              backgroundColor: 'white',
              border: '1px solid #DDD',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <ChevronLeft size={32} color={colors.textSecondary} />
          </button>
          <button
            onClick={nextBanner}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '100px',
              backgroundColor: 'white',
              border: '1px solid #DDD',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <ChevronRight size={32} color={colors.textSecondary} />
          </button>

          {/* Gradient Fade */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100px',
              background: `linear-gradient(transparent, ${colors.bgGray})`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Category Cards */}
        <div
          style={{
            padding: '0 20px 20px',
            marginTop: '-60px',
            position: 'relative',
            zIndex: 10,
            maxWidth: '1500px',
            margin: '-60px auto 0',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
          >
            {categoryCards.map((card, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: '4px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: colors.textPrimary, lineHeight: '1.3' }}>
                  {card.title}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  {card.items.map((item, j) => (
                    <div key={j} style={{ cursor: 'pointer' }}>
                      <div
                        style={{
                          aspectRatio: '1',
                          backgroundColor: item.bgColor,
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '36px',
                        }}
                      >
                        {item.emoji}
                      </div>
                      <span style={{ fontSize: '12px', color: colors.textPrimary, lineHeight: '1.2', display: 'block' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="#"
                  style={{
                    color: colors.link,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  See more
                </a>
              </div>
            ))}
          </div>

          {/* AI Assistant Banner */}
          <div
            style={{
              marginTop: '20px',
              backgroundColor: colors.white,
              borderRadius: '4px',
              padding: '24px 32px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${colors.navbar} 0%, ${colors.navbarHover} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: colors.orange,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingCart size={30} color={colors.white} />
              </div>
              <div>
                <h3 style={{ color: colors.white, fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Try our new AI Shopping Assistant!
                </h3>
                <p style={{ color: '#CCC', fontSize: '14px' }}>
                  Find products, compare prices, and place orders instantly through chat
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(true)}
              style={{
                backgroundColor: colors.buttonYellow,
                border: 'none',
                borderRadius: '20px',
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: colors.textPrimary,
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
            >
              Start Shopping with AI
            </button>
          </div>

          {/* Product Carousel */}
          <div
            style={{
              marginTop: '20px',
              backgroundColor: colors.white,
              borderRadius: '4px',
              padding: '20px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary }}>
                Starting ₹70,348 | From daily commutes to weekend thrills
              </h3>
              <a href="#" style={{ color: colors.link, fontSize: '13px', textDecoration: 'none' }}>
                See all offers
              </a>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}
            >
              {carouselProducts.map((product, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: '200px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      height: '150px',
                      backgroundColor: product.bgColor,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '60px',
                    }}
                  >
                    {product.emoji}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textPrimary, fontWeight: '500' }}>
                    {product.title}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: 'bold' }}>
                    {product.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Second Row of Category Cards */}
          <div
            style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
          >
            {[
              {
                title: 'Fashion for every occasion',
                items: [
                  { label: "Men's clothing", emoji: '👔', bgColor: '#E3F2FD' },
                  { label: "Women's fashion", emoji: '👗', bgColor: '#FCE4EC' },
                  { label: 'Kids wear', emoji: '👶', bgColor: '#FFF9C4' },
                  { label: 'Accessories', emoji: '👜', bgColor: '#F3E5F5' },
                ],
              },
              {
                title: 'Beauty picks for you',
                items: [
                  { label: 'Skincare', emoji: '🧴', bgColor: '#E8F5E9' },
                  { label: 'Makeup', emoji: '💄', bgColor: '#FCE4EC' },
                  { label: 'Haircare', emoji: '💇', bgColor: '#FFF3E0' },
                  { label: 'Fragrances', emoji: '🌸', bgColor: '#F3E5F5' },
                ],
              },
              {
                title: 'Gaming accessories',
                items: [
                  { label: 'Controllers', emoji: '🎮', bgColor: '#E8EAF6' },
                  { label: 'Headsets', emoji: '🎧', bgColor: '#E1F5FE' },
                  { label: 'Gaming chairs', emoji: '🪑', bgColor: '#ECEFF1' },
                  { label: 'Keyboards', emoji: '⌨️', bgColor: '#E0E0E0' },
                ],
              },
              {
                title: 'Fitness & Sports',
                items: [
                  { label: 'Dumbbells', emoji: '🏋️', bgColor: '#FFCCBC' },
                  { label: 'Yoga mats', emoji: '🧘', bgColor: '#C8E6C9' },
                  { label: 'Sports shoes', emoji: '👟', bgColor: '#BBDEFB' },
                  { label: 'Smartwatches', emoji: '⌚', bgColor: '#D7CCC8' },
                ],
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: '4px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: colors.textPrimary }}>
                  {card.title}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  {card.items.map((item, j) => (
                    <div key={j} style={{ cursor: 'pointer' }}>
                      <div
                        style={{
                          aspectRatio: '1',
                          backgroundColor: item.bgColor,
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '36px',
                        }}
                      >
                        {item.emoji}
                      </div>
                      <span style={{ fontSize: '12px', color: colors.textPrimary, lineHeight: '1.2', display: 'block' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="#"
                  style={{
                    color: colors.link,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  See more
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer spacer */}
        <div style={{ height: '100px' }} />
      </main>

      {/* Chatbot */}
      {!isChatMinimized && (
        <ChatbotWindow
          isOpen={isChatOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
          onCartUpdate={handleCartUpdate}
        />
      )}

      {/* Chatbot Toggle Button - Show when closed or minimized */}
      {(!isChatOpen || isChatMinimized) && (
        <ChatbotButton
          isOpen={false}
          onClick={handleToggleChat}
          hasUnread={isChatMinimized}
        />
      )}
    </div>
  )
}
