import { SpaModel } from '../types'

export const spaModels: SpaModel[] = [
  {
    id: 'bergen',
    name: 'Bergen Portable Spa',
    dimensions: {
      length: 2.04,
      width: 2.04,
      height: 0.8
    },
    capacity: 6,
    price: 949,
    imageUrl: '/spa-images/bergen.png',
    colors: ['Arctic White', 'Teak', 'Charcoal Grey'],
    sku: 'A083021',
    tags: ['budget-friendly', 'easy setup', 'round'],
    productUrl: 'https://portablespas.co.nz/products/bergen-spa'
  },
  {
    id: 'tekapo',
    name: 'Tekapo Portable Spa',
    dimensions: {
      length: 1.85,
      width: 1.85,
      height: 0.8
    },
    capacity: 6,
    price: 1099,
    imageUrl: '/spa-images/tekapo.png',
    colors: ['Pure White', 'Lake Blue', 'Storm Grey'],
    sku: 'A083019',
    tags: ['entry-level', 'affordable', 'square'],
    productUrl: 'https://portablespas.co.nz/products/tekapo-spa'
  },
  {
    id: 'camaro',
    name: 'Camaro Portable Spa',
    dimensions: {
      length: 2.1,
      width: 2.1,
      height: 0.85
    },
    capacity: 4,
    price: 1099,
    imageUrl: '/spa-images/camaro.png',
    colors: ['Pearl White', 'Racing Red', 'Carbon Black'],
    sku: 'SPA-P-CA063',
    tags: ['mid-range', 'enhanced features', '4-person'],
    productUrl: 'https://portablespas.co.nz/products/camaro-spa'
  },
  {
    id: 'mono-eco-6',
    name: 'Mono-Eco 6 Portable Spa',
    dimensions: {
      length: 1.73,
      width: 1.73,
      height: 0.9
    },
    capacity: 6,
    price: 1999,
    imageUrl: '/spa-images/mono-eco-6.png',
    colors: ['Eco White', 'Forest Green', 'Stone Grey'],
    sku: 'F-MO062WE',
    tags: ['eco-friendly', 'energy-efficient', 'round'],
    productUrl: 'https://portablespas.co.nz/products/mono-spa-6-person-store-demo-pick-up-christchurch-only-copy'
  },
  {
    id: 'mono-eco-8',
    name: 'Mono-Eco 8 Portable Spa',
    dimensions: {
      length: 1.92,
      width: 1.92,
      height: 0.95
    },
    capacity: 8,
    price: 2599,
    imageUrl: '/spa-images/mono-eco-8.png',
    colors: ['Alpine White', 'Sapphire Blue', 'Storm Grey', 'Sandstone'],
    sku: 'A083515',
    tags: ['large-family', 'spacious', 'round'],
    productUrl: 'https://portablespas.co.nz/products/mono-spa-190'
  },
  {
    id: 'oslo',
    name: 'Oslo Portable Spa',
    dimensions: {
      length: 1.80,
      width: 1.80,
      height: 0.9
    },
    capacity: 6,
    price: 3399,
    imageUrl: '/spa-images/oslo.png',
    colors: ['Nordic White', 'Midnight Blue', 'Charcoal'],
    sku: 'F-OS063W',
    tags: ['luxury', 'premium', 'hydro jets', 'square'],
    productUrl: 'https://portablespas.co.nz/products/oslo-spa-new-improved'
  },
  {
    id: 'tuscany',
    name: 'Tuscany Portable Spa',
    dimensions: {
      length: 2.3,
      width: 2.3,
      height: 0.95
    },
    capacity: 4,
    price: 1999,
    imageUrl: '/spa-images/tuscany.png',
    colors: ['Ivory', 'Terracotta', 'Graphite'],
    sku: 'F-TU062W',
    tags: ['flagship', 'ultimate premium', '4-person'],
    productUrl: 'https://portablespas.co.nz/products/tuscany-spa-copy'
  }
]