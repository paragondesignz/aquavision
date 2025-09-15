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
  currentResultImage?: string,
  isFirstGeneration?: boolean
): Promise<VisualizationResult> {
  
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add your API key to the .env file.')
  }

  if (mode === 'initial') {
    // Use image generation for initial placement
    // Only add watermark if this is the very first generation (not regenerations)
    const generatedImage = await generateImageWithSpa(uploadedImage, spaModel, undefined, lightingPrompt, isFirstGeneration)
    
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
        lightingPrompt,
        false // Never add watermark for adjustments
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
  const conversationalPrompt = `Keep everything in this image exactly the same - the spa position, size, orientation, colors, and all other elements must remain completely unchanged. Only change the lighting and atmospheric conditions.

${lightingPrompt}

CRITICAL CONVERSATIONAL EDITING INSTRUCTIONS:
- This is a follow-up edit to preserve the original composition
- DO NOT move, resize, or reposition any objects, especially the spa
- ONLY change lighting, shadows, sky colors, and atmospheric effects
- Maintain all object positions, colors, and arrangements exactly as they are
- The goal is to show the same scene with different lighting conditions

ABSOLUTE SPACE PRESERVATION RULES:
- NEVER alter, modify, or change the background space/environment in any way
- NEVER add, remove, or modify any architectural elements (decks, patios, railings, walls, structures)
- NEVER change the landscaping, grass, plants, trees, or garden features
- NEVER alter the ground surfaces, pathways, or hardscaping
- NEVER modify furniture, outdoor equipment, or existing objects in the space
- The ONLY things that can change are: lighting, shadows, sky color, and atmospheric effects
- The space must remain 100% identical except for lighting conditions

LOCATION CONTEXT: This scene is set in New Zealand (Southern Hemisphere, Oceania). Apply lighting that is accurate for New Zealand's geographic location, climate, and lighting conditions.`

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

async function addWatermarkToImage(imageDataUrl: string): Promise<string> {
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
        // Calculate proper proportions and larger size
        const maxWidth = 80 // Make it larger - 80px max width
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
        
        // Draw the watermark logo directly (no background - fully transparent)
        ctx.globalAlpha = 0.67 // 67% opacity
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
  lightingPrompt?: string,
  addWatermark: boolean = true
): Promise<string> {
  // Convert images to base64
  const imageBase64 = await fileToBase64(uploadedImage.file)
  const spaImageBase64 = await fetchImageAsBase64(spaModel.imageUrl)
  
  const prompt = customPrompt || `Place this ${spaModel.name} spa pool in the most optimal space in the scene. Ensure it is optimally sized, rotated and oriented.
    
    IMAGE QUALITY REQUIREMENTS:
    - Generate a high-resolution image with crisp, clear details
    - Ensure the output resolution is at least 1024x1024 pixels for optimal quality
    - Maintain sharp edges and clear textures throughout the image
    - Avoid pixelation or blurriness in the final result
    
    CRITICAL SPACE PRESERVATION:
    - NEVER alter, modify, or change the background space/environment in any way
    - NEVER add, remove, or modify any architectural elements (decks, patios, railings, walls, structures) 
    - NEVER change the landscaping, grass, plants, trees, or garden features
    - NEVER alter the ground surfaces, pathways, or hardscaping
    - NEVER modify existing furniture, outdoor equipment, or objects in the space
    - ONLY ADD the spa pool to the existing space - everything else must remain identical
    - The background space is perfect as-is and must not be touched or improved
    
    CRITICAL: Keep the spa's EXACT original appearance, color, texture, and design unchanged. Do NOT modify the spa's color, finish, or any visual properties. NEVER add any logos, text, or branding to the spa that aren't present in the original spa image.
    
    ALIGNMENT AND ORIENTATION RULES:
    - ALIGN the spa with existing architectural lines and deck geometry
    - If the deck/patio has straight edges, align the spa parallel to those edges
    - For square/rectangular spas: orient them to match the deck's lines (not at 45-degree angles unless the deck itself is angled)
    - For round spas: ensure they complement the space's geometry and don't conflict with linear elements
    - Follow the natural flow and orientation of the existing structures (decking boards, railings, building walls)
    - The spa should look like it was professionally installed as part of the original design
    
    The spa should be:
    - Positioned on a flat, stable surface (patio, deck, or concrete area)
    - CORRECTLY SCALED: The spa measures ${spaModel.dimensions.length}m x ${spaModel.dimensions.width}m x ${spaModel.dimensions.height}m high. Use reference objects in the image (doors, windows, furniture, railings, people, etc.) to ensure accurate real-world scaling. A standard door is ~2m high, windows are typically 1-1.5m wide, outdoor furniture like chairs are ~0.8m high. Scale the spa appropriately using these visual references
    - Naturally integrated into the environment with realistic shadows and lighting that match the scene
    - Properly oriented to complement existing architectural features and deck lines
    - FILLED WITH CLEAR, CLEAN WATER that reflects light naturally and shows gentle water ripples
    - Water should appear crystal clear and inviting, not empty or dry
    - MAINTAIN the spa's original color: ${spaModel.selectedColor || 'original color as shown in the spa image'}
    
    IMPORTANT: Only change the spa's position, size, and rotation. Keep all other visual aspects (color, texture, materials, design) exactly as they appear in the original spa image. ALWAYS show the spa filled with beautiful, clear water.
    
    Make it look like the spa naturally belongs in this space and was designed to complement the existing architecture while preserving its authentic appearance and showing it ready for use with clean water.
    
    ${lightingPrompt ? `
    *** CRITICAL LIGHTING TRANSFORMATION ***
    LOCATION CONTEXT: This scene is set in New Zealand (Southern Hemisphere, Oceania). Apply lighting that is accurate for New Zealand's geographic location, climate, and lighting conditions.
    
    ${lightingPrompt}
    
    LIGHTING REQUIREMENTS:
    - The lighting change should be subtle and realistic - avoid oversaturation or dramatic effects
    - Apply natural lighting appropriate for the time of day with realistic intensity
    - Adjust sky colors, shadow lengths, surface reflections, and overall atmosphere naturally and subtly
    - The spa water should reflect the lighting conditions realistically without excessive glare or brightness
    - Surfaces in the scene should show natural lighting effects for the time of day - keep effects understated
    - Make the time of day change visible while maintaining natural realism - avoid overstyling
    - Apply lighting that is geographically accurate for New Zealand conditions with natural subtlety
    - CRITICAL: Keep all lighting effects natural and understated - avoid oversaturation, excessive drama, or artificial-looking enhancements
    
    POSITIONING ABSOLUTE LOCK:
    - MAINTAIN THE EXACT SAME SPA POSITION, SIZE, AND PLACEMENT - only change lighting/atmosphere
    - Do not move, resize, or reposition the spa pool - keep it in the exact same location
    - The spa is already positioned correctly - DO NOT ADJUST ITS PLACEMENT AT ALL
    - Treat the spa position as completely FIXED and UNCHANGEABLE
    - Apply lighting changes around the EXISTING spa placement without moving it
    *** END LIGHTING TRANSFORMATION ***
    ` : ''}`

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
    // Only add watermark if requested (first generation only)
    if (addWatermark) {
      const watermarkedImage = await addWatermarkToImage(generatedImageData)
      return watermarkedImage
    }
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

function commandToPrompt(command: string, spaModel: SpaModel, lightingPrompt?: string): string {
  const lowerCommand = command.toLowerCase()
  
  // Handle lighting-only changes
  if (lowerCommand.includes('change lighting only') || lowerCommand.includes('maintain current position')) {
    let prompt = `
    *** CRITICAL POSITIONING LOCK ***
    This is a LIGHTING-ONLY change. The spa pool is already perfectly positioned and MUST NOT BE MOVED AT ALL.
    
    ABSOLUTE POSITIONING REQUIREMENTS:
    - The ${spaModel.name} spa pool MUST remain in its EXACT current position - DO NOT MOVE IT EVEN SLIGHTLY
    - DO NOT change the spa's size, rotation, or orientation in any way
    - DO NOT reposition, relocate, or adjust the spa placement at all
    - The spa is already where it needs to be - ONLY change lighting and atmosphere
    - IGNORE any impulse to improve or adjust the spa placement - keep it exactly where it is
    - Use the existing spa as a fixed reference point that cannot be altered
    
    LIGHTING CHANGE ONLY:
    Apply new lighting and atmospheric conditions to the EXISTING scene without moving anything.
    Transform ONLY the lighting, sky, shadows, reflections, and ambient conditions.
    Keep everything else (including spa position) exactly as it currently appears.
    *** END POSITIONING LOCK ***
    
    CRITICAL SPACE PRESERVATION FOR LIGHTING CHANGES:
    - NEVER alter, modify, or change the background space/environment in any way
    - NEVER add, remove, or modify any architectural elements (decks, patios, railings, walls, structures)
    - NEVER change the landscaping, grass, plants, trees, or garden features  
    - NEVER alter the ground surfaces, pathways, or hardscaping
    - NEVER modify existing furniture, outdoor equipment, or objects in the space
    - ONLY change lighting conditions - everything else must remain identical
    - The background space is perfect as-is and must not be touched or improved
    
    CRITICAL: Keep the spa's EXACT original appearance, color, texture, and design unchanged. Do NOT modify the spa's color, finish, or any visual properties. NEVER add any logos, text, or branding to the spa that aren't present in the original spa image.
    `
    
    prompt += `
    IMPORTANT: This is purely a lighting adjustment - NO positioning changes allowed and NO space modifications allowed. Keep all spa aspects (position, size, rotation, color: ${spaModel.selectedColor || 'original'}, texture, materials, design) exactly as they currently appear in the image. Keep ALL background elements exactly as they are.
    
    ALWAYS show the spa FILLED WITH CLEAR, CLEAN WATER that reflects the new lighting conditions naturally and shows gentle water ripples. Water should appear crystal clear and inviting, never empty or dry.
    
    Apply ONLY the lighting transformation while preserving the spa's exact current position and ensuring it looks natural with the new lighting conditions.`
    
    return prompt
  }
  
  // Handle regular position adjustments
  let prompt = `Adjust the placement of the ${spaModel.name} spa pool in the scene. 
  
  CRITICAL SPACE PRESERVATION:
  - NEVER alter, modify, or change the background space/environment in any way
  - NEVER add, remove, or modify any architectural elements (decks, patios, railings, walls, structures)
  - NEVER change the landscaping, grass, plants, trees, or garden features
  - NEVER alter the ground surfaces, pathways, or hardscaping  
  - NEVER modify existing furniture, outdoor equipment, or objects in the space
  - ONLY reposition the spa pool within the existing space - everything else must remain identical
  - The background space is perfect as-is and must not be touched or improved
  
  CRITICAL: Keep the spa's EXACT original appearance, color, texture, and design unchanged. Do NOT modify the spa's color, finish, or any visual properties.
  
  ALIGNMENT AND ORIENTATION RULES:
  - ALIGN the spa with existing architectural lines and deck geometry
  - If the deck/patio has straight edges, align the spa parallel to those edges
  - For square/rectangular spas: orient them to match the deck's lines (not at 45-degree angles unless the deck itself is angled)
  - For round spas: ensure they complement the space's geometry and don't conflict with linear elements
  - Follow the natural flow and orientation of the existing structures (decking boards, railings, building walls)
  - The spa should look like it was professionally installed as part of the original design
  
  `
  
  if (lowerCommand.includes('left')) {
    prompt += 'Move the spa to the left. '
  } else if (lowerCommand.includes('right')) {
    prompt += 'Move the spa to the right. '
  }
  
  if (lowerCommand.includes('up') || lowerCommand.includes('top')) {
    prompt += 'Move the spa upward/toward the top of the image. '
  } else if (lowerCommand.includes('down') || lowerCommand.includes('bottom')) {
    prompt += 'Move the spa downward/toward the bottom of the image. '
  }
  
  if (lowerCommand.includes('rotate')) {
    const angleMatch = lowerCommand.match(/(\d+)/)
    if (angleMatch) {
      prompt += `Rotate the spa by ${angleMatch[1]} degrees. `
    } else {
      prompt += 'Rotate the spa 45 degrees. '
    }
  }
  
  if (lowerCommand.includes('smaller') || lowerCommand.includes('shrink')) {
    prompt += 'Make the spa smaller. '
  } else if (lowerCommand.includes('larger') || lowerCommand.includes('bigger')) {
    prompt += 'Make the spa larger. '
  }
  
  if (lowerCommand.includes('deck')) {
    prompt += 'Place the spa on or near the deck. '
  } else if (lowerCommand.includes('patio')) {
    prompt += 'Place the spa on the patio. '
  } else if (lowerCommand.includes('grass') || lowerCommand.includes('lawn')) {
    prompt += 'Place the spa on the grass/lawn area. '
  }
  
  prompt += `
  
  IMPORTANT: Only change the spa's position, size, and rotation. Keep all other visual aspects (color: ${spaModel.selectedColor || 'original'}, texture, materials, design) exactly as they appear in the original spa image.
  
  ALWAYS show the spa FILLED WITH CLEAR, CLEAN WATER that reflects light naturally and shows gentle water ripples. Water should appear crystal clear and inviting, never empty or dry.
  
  Ensure the spa looks natural, properly lit, and fully integrated into the scene with appropriate shadows while preserving its authentic appearance and showing it ready for use with beautiful water. The spa should appear professionally installed and aligned with the existing architectural features and deck geometry.
  
  ${lightingPrompt ? `
  *** CRITICAL LIGHTING TRANSFORMATION ***
  LOCATION CONTEXT: This scene is set in New Zealand (Southern Hemisphere, Oceania). Apply lighting that is accurate for New Zealand's geographic location, climate, and lighting conditions.
  
  ${lightingPrompt}
  
  LIGHTING REQUIREMENTS:
  - The lighting change should be subtle and realistic - avoid oversaturation or dramatic effects
  - Apply natural lighting appropriate for the time of day with realistic intensity
  - Adjust sky colors, shadow lengths, surface reflections, and overall atmosphere naturally and subtly
  - The spa water should reflect the lighting conditions realistically without excessive glare or brightness
  - Surfaces in the scene should show natural lighting effects for the time of day - keep effects understated
  - Make the time of day change visible while maintaining natural realism - avoid overstyling
  - Apply lighting that is geographically accurate for New Zealand conditions with natural subtlety
  - CRITICAL: Keep all lighting effects natural and understated - avoid oversaturation, excessive drama, or artificial-looking enhancements
  
  POSITIONING ABSOLUTE LOCK:
  - MAINTAIN THE EXACT SAME SPA POSITION, SIZE, AND PLACEMENT - only change lighting/atmosphere
  - Do not move, resize, or reposition the spa pool - keep it in the exact same location
  - The spa is already positioned correctly - DO NOT ADJUST ITS PLACEMENT AT ALL
  - Treat the spa position as completely FIXED and UNCHANGEABLE
  - Apply lighting changes around the EXISTING spa placement without moving it
  *** END LIGHTING TRANSFORMATION ***
  ` : ''}`
  
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