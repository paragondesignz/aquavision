import { GoogleGenAI } from '@google/genai'
import { UploadedImage, SpaModel, Position, VisualizationResult } from '../types'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

if (!API_KEY) {
  console.error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file')
}

const ai = new GoogleGenAI({
  apiKey: API_KEY,
})

export async function processWithGemini(
  uploadedImage: UploadedImage,
  spaModel: SpaModel,
  mode: 'initial' | 'adjust',
  command?: string,
  currentPosition?: Position,
  lightingPrompt?: string,
  currentResultImage?: string
): Promise<VisualizationResult> {
  
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to the .env file.')
  }

  if (mode === 'initial') {
    // Use image generation for initial placement
    const generatedImage = await generateImageWithSpa(uploadedImage, spaModel, undefined, lightingPrompt)
    
    return {
      imageUrl: generatedImage,
      position: {
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0
      }
    }
  } else {
    // Check if this is a lighting-only change
    const isLightingOnly = command?.toLowerCase().includes('change lighting only') || command?.toLowerCase().includes('maintain current position')
    
    if (isLightingOnly && currentResultImage && lightingPrompt) {
      // Use conversational editing approach for lighting changes
      const lightingAdjustedImage = await generateConversationalLightingEdit(currentResultImage, lightingPrompt)
      
      return {
        imageUrl: lightingAdjustedImage,
        position: currentPosition || { x: 50, y: 50, scale: 1, rotation: 0 }
      }
    } else {
      // For regular position adjustments, regenerate with new instructions
      // Never add watermark for adjustments
      const newPosition = adjustPositionByCommand(command || '', currentPosition || {
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0
      })
      
      const adjustedImage = await generateImageWithSpa(
        uploadedImage, 
        spaModel, 
        commandToPrompt(command || '', spaModel, lightingPrompt),
        lightingPrompt
      )
      
      return {
        imageUrl: adjustedImage,
        position: newPosition
      }
    }
  }
}

async function generateConversationalLightingEdit(
  currentImageDataUrl: string,
  lightingPrompt: string
): Promise<string> {
  // Convert current result image to base64
  const imageBase64 = currentImageDataUrl.includes('base64,') 
    ? currentImageDataUrl.split('base64,')[1]
    : currentImageDataUrl

  // Use conversational editing approach as recommended by Gemini documentation
  const conversationalPrompt = `CRITICAL LIGHTING-ONLY EDIT: There is EXACTLY ONE spa in this image. Keep EXACTLY ONE spa.

ABSOLUTE RULES:
1. NEVER add additional spa pools - keep EXACTLY ONE spa
2. NEVER duplicate the existing spa pool
3. NEVER create multiple spas - there must be EXACTLY ONE spa in the final image
4. Change ONLY lighting, shadows, and sky colors
5. Keep the existing spa in its exact position with exact appearance
6. Apply this lighting: ${lightingPrompt}

CRITICAL: If you create multiple spas or add any spa pools, you have completely failed. EXACTLY ONE spa only.`

  const config = {
    responseModalities: ['IMAGE', 'TEXT'] as string[],
  }
  
  const model = 'gemini-2.5-flash-image-preview'
  
  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          text: conversationalPrompt,
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ],
    },
  ]

  console.log('Sending conversational lighting edit to Gemini API')
  
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  })

  // Process the streaming response
  let generatedImageData: string | null = null
  let textResponse = ''
  
  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue
    }
    
    for (const part of chunk.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log('Found lighting-edited image in response!')
        const { mimeType, data } = part.inlineData
        generatedImageData = `data:${mimeType};base64,${data}`
        break
      } else if (part.text) {
        textResponse += part.text
        console.log('Text response:', part.text)
      }
    }
    
    if (generatedImageData) break
  }
  
  if (generatedImageData) {
    // For conversational lighting edits, don't add another watermark since the original already has one
    return generatedImageData
  }
  
  throw new Error(`No image generated during lighting edit. API Response: ${textResponse || 'No response text'}`)
}

export async function addWatermarkToImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    const mainImage = new Image()
    mainImage.crossOrigin = 'anonymous'
    
    mainImage.onload = () => {
      // Set canvas size to match the main image
      canvas.width = mainImage.width
      canvas.height = mainImage.height
      
      // Draw the main image
      ctx.drawImage(mainImage, 0, 0)
      
      // Load and draw the watermark
      const watermark = new Image()
      watermark.crossOrigin = 'anonymous'
      
      watermark.onload = () => {
        // Calculate proper proportions and larger size (30% bigger than before)
        const maxWidth = 104 // 80px * 1.3 = 104px max width
        const aspectRatio = watermark.width / watermark.height
        
        let logoWidth, logoHeight
        if (aspectRatio > 1) {
          // Wider than tall
          logoWidth = maxWidth
          logoHeight = maxWidth / aspectRatio
        } else {
          // Taller than wide or square
          logoHeight = maxWidth
          logoWidth = maxWidth * aspectRatio
        }
        
        const padding = 15 // Padding from bottom-left corner
        
        // Position at bottom-left with padding
        const x = padding
        const y = canvas.height - logoHeight - padding
        
        // Draw the watermark logo with reduced opacity (less opaque)
        ctx.globalAlpha = 0.5 // 50% opacity (down from 67%)
        ctx.drawImage(watermark, x, y, logoWidth, logoHeight)
        
        // Convert to data URL with PNG to preserve transparency
        const watermarkedImage = canvas.toDataURL('image/png')
        resolve(watermarkedImage)
      }
      
      watermark.onerror = () => {
        console.warn('Failed to load watermark, returning original image')
        resolve(imageDataUrl)
      }
      
      watermark.src = '/spa-images/logo white -trademark-small.png'
    }
    
    mainImage.onerror = () => reject(new Error('Failed to load main image for watermarking'))
    mainImage.src = imageDataUrl
  })
}

async function generateImageWithSpa(
  uploadedImage: UploadedImage,
  spaModel: SpaModel,
  customPrompt?: string,
  lightingPrompt?: string
): Promise<string> {
  // Convert images to base64
  const imageBase64 = await fileToBase64(uploadedImage.file)
  const spaImageBase64 = await fetchImageAsBase64(spaModel.imageUrl)
  
  const prompt = customPrompt || `CRITICAL: Copy the spa from the second image EXACTLY as shown - NO logos, NO text, NO branding additions.

Place this spa into the outdoor space shown in the first image.

MANDATORY RULES:
1. Copy the spa appearance EXACTLY - if the spa image shows no logos, add NO logos
2. NO logos, NO text, NO branding, NO graphics on the spa - copy only what you see
3. This is an ABOVE GROUND spa - place it ON TOP of the deck/patio surface
4. CRITICAL SCALING: Size the spa to ${spaModel.dimensions.length}m x ${spaModel.dimensions.width}m x ${spaModel.dimensions.height}m. Use these references: doors are ~2m high, windows ~1-1.5m wide, outdoor chairs ~0.8m high, railings ~1m high. Scale the spa accurately using these objects as size references.
5. Place only ONE spa in the scene
6. Fill with clear water
7. DO NOT modify the background space

CRITICAL: If you add ANY logos or text to the spa that aren't in the reference image, you have failed.${lightingPrompt ? ` Apply this lighting: ${lightingPrompt}` : ''}`

  const config = {
    responseModalities: ['IMAGE', 'TEXT'] as string[],
  }
  
  const model = 'gemini-2.5-flash-image-preview'
  
  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: uploadedImage.file.type || 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: spaImageBase64,
          },
        },
      ],
    },
  ]

  console.log('Sending request to Gemini API with model:', model)
  
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  })

  // Process the streaming response
  let generatedImageData: string | null = null
  let textResponse = ''
  
  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue
    }
    
    for (const part of chunk.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log('Found image in response!')
        const { mimeType, data } = part.inlineData
        generatedImageData = `data:${mimeType};base64,${data}`
        break
      } else if (part.text) {
        textResponse += part.text
        console.log('Text response:', part.text)
      }
    }
    
    if (generatedImageData) break
  }
  
  if (generatedImageData) {
    // Don't add watermark during generation - it will be added on download
    return generatedImageData
  }
  
  // If no image was generated, throw detailed error
  throw new Error(`No image generated. API Response: ${textResponse || 'No response text'}`)
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function fetchImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')
      resolve(dataUrl.split(',')[1])
    }
    
    img.onerror = () => reject(new Error('Failed to load spa image'))
    img.src = url
  })
}

function commandToPrompt(command: string, _spaModel: SpaModel, lightingPrompt?: string): string {
  const lowerCommand = command.toLowerCase()
  
  if (lowerCommand.includes('change lighting only') || lowerCommand.includes('maintain current position')) {
    return `CRITICAL: Change ONLY lighting. EXACTLY ONE spa must remain - NEVER add or duplicate spas. Keep everything else exactly the same. Apply: ${lightingPrompt}`
  }
  
  let prompt = `CRITICAL: Keep spa appearance identical to reference image - NO logos added. Adjust position only.

This is an ABOVE GROUND spa (${_spaModel.dimensions.length}m x ${_spaModel.dimensions.width}m x ${_spaModel.dimensions.height}m) - keep it on top of the deck/patio surface. Maintain proper scale using doors (~2m high), windows (~1-1.5m wide), chairs (~0.8m high) as references. `
  
  if (lowerCommand.includes('left')) prompt += 'Move spa left. '
  if (lowerCommand.includes('right')) prompt += 'Move spa right. '
  if (lowerCommand.includes('up') || lowerCommand.includes('back')) prompt += 'Move spa back. '
  if (lowerCommand.includes('down') || lowerCommand.includes('forward')) prompt += 'Move spa forward. '
  
  prompt += 'CRITICAL: NO logos, NO text, NO branding on spa. Fill with clear water.'
  
  if (lightingPrompt) prompt += ` Apply lighting: ${lightingPrompt}`
  
  return prompt
}

function adjustPositionByCommand(command: string, currentPosition: Position): Position {
  const lowerCommand = command.toLowerCase()
  let newPosition = { ...currentPosition }
  
  // Movement commands
  if (lowerCommand.includes('left')) {
    newPosition.x = Math.max(10, currentPosition.x - 10)
  } else if (lowerCommand.includes('right')) {
    newPosition.x = Math.min(90, currentPosition.x + 10)
  }
  
  if (lowerCommand.includes('up') || lowerCommand.includes('top')) {
    newPosition.y = Math.max(10, currentPosition.y - 10)
  } else if (lowerCommand.includes('down') || lowerCommand.includes('bottom')) {
    newPosition.y = Math.min(90, currentPosition.y + 10)
  }
  
  // Rotation commands
  if (lowerCommand.includes('rotate')) {
    const angleMatch = lowerCommand.match(/(\d+)/)
    if (angleMatch) {
      newPosition.rotation = (currentPosition.rotation + parseInt(angleMatch[1])) % 360
    } else {
      newPosition.rotation = (currentPosition.rotation + 45) % 360
    }
  }
  
  // Scale commands
  if (lowerCommand.includes('smaller') || lowerCommand.includes('shrink')) {
    newPosition.scale = Math.max(0.5, currentPosition.scale - 0.1)
  } else if (lowerCommand.includes('larger') || lowerCommand.includes('bigger')) {
    newPosition.scale = Math.min(2.0, currentPosition.scale + 0.1)
  }
  
  // Natural language positioning
  if (lowerCommand.includes('center')) {
    newPosition.x = 50
    newPosition.y = 50
  } else if (lowerCommand.includes('corner')) {
    if (lowerCommand.includes('top') && lowerCommand.includes('left')) {
      newPosition.x = 20
      newPosition.y = 20
    } else if (lowerCommand.includes('top') && lowerCommand.includes('right')) {
      newPosition.x = 80
      newPosition.y = 20
    } else if (lowerCommand.includes('bottom') && lowerCommand.includes('left')) {
      newPosition.x = 20
      newPosition.y = 80
    } else if (lowerCommand.includes('bottom') && lowerCommand.includes('right')) {
      newPosition.x = 80
      newPosition.y = 80
    }
  }
  
  return newPosition
}