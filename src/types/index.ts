export interface UploadedImage {
  file: File
  url: string
  width: number
  height: number
}

export interface SpaModel {
  id: string
  name: string
  dimensions: {
    length: number
    width: number
    height: number
  }
  capacity: number
  price: number
  imageUrl: string
  colors: string[]
  selectedColor?: string
  sku?: string
  tags?: string[]
  productUrl?: string
}

export interface Position {
  x: number
  y: number
  scale: number
  rotation: number
}

export interface VisualizationResult {
  imageUrl: string
  position: Position
}