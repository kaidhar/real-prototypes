'use client'

import React from 'react'
import { Star, ShoppingCart } from 'lucide-react'
import { Product } from './types'

// Amazon design tokens
const colors = {
  textPrimary: '#0F1111',
  textSecondary: '#565959',
  link: '#007185',
  orange: '#FF9900',
  white: '#FFFFFF',
  bgLight: '#F0F2F2',
  border: '#DDD',
  buttonYellow: '#FFD814',
  buttonYellowHover: '#F7CA00',
  buttonOrange: '#FFA41C',
  priceRed: '#B12704',
  prime: '#232F3E',
  star: '#FFA41C',
  success: '#067D62',
}

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
  onBuyNow: () => void
}

export default function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
      }}
    >
      {/* Product Image */}
      <div
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: colors.bgLight,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={product.image}
          alt={product.title}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.innerHTML = `
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            `
          }}
        />
      </div>

      {/* Product Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div
          style={{
            fontSize: '13px',
            color: colors.link,
            lineHeight: '1.3',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            cursor: 'pointer',
          }}
        >
          {product.title}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.floor(product.rating) ? colors.star : 'none'}
                color={colors.star}
              />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: colors.link }}>
            {product.rating} ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textPrimary }}>
              ₹{product.price.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: colors.textSecondary, textDecoration: 'line-through' }}>
              ₹{product.originalPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: colors.priceRed, fontWeight: 'bold' }}>
              ({discount}% off)
            </span>
          </div>
          {product.isPrime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span
                style={{
                  backgroundColor: colors.prime,
                  color: colors.white,
                  fontSize: '9px',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontWeight: 'bold',
                }}
              >
                prime
              </span>
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                FREE Delivery
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onAddToCart}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: colors.buttonYellow,
              border: `1px solid #F2C200`,
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: colors.textPrimary,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.buttonYellowHover
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.buttonYellow
            }}
          >
            <ShoppingCart size={12} />
            Add to Cart
          </button>
          <button
            onClick={onBuyNow}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: colors.buttonOrange,
              border: `1px solid #E77600`,
              borderRadius: '20px',
              cursor: 'pointer',
              color: colors.textPrimary,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#E77600'
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.buttonOrange
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
