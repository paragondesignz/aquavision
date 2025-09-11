import { useState, useEffect } from 'react'
import { UploadedImage, SpaModel, Position } from '../types'
import { processWithGemini } from '../services/geminiService'

interface VisualizerProps {
  uploadedImage: UploadedImage
  selectedSpa: SpaModel
}

function Visualizer({ uploadedImage, selectedSpa }: VisualizerProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<Position>({
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0
  })
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [timeOfDay, setTimeOfDay] = useState(12) // 24-hour format, 12 = noon
  const [tipIndex, setTipIndex] = useState(0)

  const tips = [
    "If the positioning looks weird, try generating another placement",
    "Use the time of day slider to see your MSpa in your space at different times",
    "The positioning buttons will give you a little control over where your MSpa sits in your space", 
    "Download your image to print or share with family and friends",
    "Try different times of day to see how lighting affects your MSpa's appearance",
    "The AI will size your MSpa realistically based on objects in your photo",
    "Each generation is unique - experiment with different placements"
  ]

  const getTimeDescription = (hour: number): string => {
    // New Zealand time descriptions
    if (hour >= 6 && hour < 8) return 'sunrise'
    if (hour >= 8 && hour < 11) return 'morning'
    if (hour >= 11 && hour < 15) return 'midday'
    if (hour >= 15 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 20) return 'golden hour'
    if (hour >= 20 && hour < 22) return 'sunset/dusk'
    if (hour >= 22 || hour < 6) return 'night'
    return 'dawn'
  }

  const formatTime12Hour = (hour: number): string => {
    if (hour === 0) return '12:00 AM'
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return '12:00 PM'
    return `${hour - 12}:00 PM`
  }

  const getLightingPrompt = (hour: number): string => {
    // New Zealand lighting conditions - realistic and natural
    if (hour >= 6 && hour < 8) return 'NEW ZEALAND SUNRISE LIGHTING: Apply realistic New Zealand sunrise lighting with natural warm golden tones. The sun is low on the horizon creating moderate length shadows. The sky shows gentle oranges and soft pinks typical of New Zealand mornings. Surfaces have warm but natural illumination and the spa water reflects the morning light realistically'
    
    if (hour >= 8 && hour < 11) return 'NEW ZEALAND MORNING LIGHTING: Apply clear, natural New Zealand morning sunlight. Create well-defined shadows and a bright blue sky characteristic of New Zealand\'s clear air. The lighting should feel fresh and bright with good visibility and natural colors typical of New Zealand mornings'
    
    if (hour >= 11 && hour < 15) return 'NEW ZEALAND MIDDAY LIGHTING: Apply strong New Zealand midday sun from overhead. Create short shadows directly under objects with bright, clear illumination typical of New Zealand\'s UV-rich environment. The sky should be deep blue and colors should appear vibrant and well-lit. The spa water should reflect the bright overhead light naturally'
    
    if (hour >= 15 && hour < 18) return 'NEW ZEALAND AFTERNOON LIGHTING: Apply warm, natural New Zealand afternoon sunlight with moderately long shadows. Golden-warm tones appear on surfaces with comfortable bright lighting and blue sky with possible afternoon clouds. The lighting should feel relaxed and pleasant, typical of New Zealand\'s afternoon ambiance'
    
    if (hour >= 18 && hour < 20) return 'NEW ZEALAND GOLDEN HOUR: Apply New Zealand\'s natural golden hour lighting with warm, soft golden tones. Create gentle side-lighting and longer shadows with golden reflections on surfaces. The sky shows natural golden-orange hues and the spa water reflects the evening light beautifully, capturing New Zealand\'s natural evening atmosphere'
    
    if (hour >= 20 && hour < 22) return 'NEW ZEALAND SUNSET LIGHTING: Apply realistic New Zealand sunset lighting with natural oranges, soft pinks, and gentle purples in the sky. The setting sun casts warm orange tones across surfaces with natural shadows and gentle reflections on the spa water. Create a peaceful, natural sunset atmosphere typical of New Zealand evenings'
    
    if (hour >= 22 || hour < 6) return 'NEW ZEALAND NIGHT LIGHTING: Apply realistic New Zealand nighttime conditions with a properly dark sky (deep blue or black with visible stars where appropriate). No daylight should be visible. Add natural outdoor lighting - warm deck lights, subtle underwater spa lighting, landscape path lights, and house/patio lighting typical of New Zealand homes. Create natural contrast between dark areas and lit spaces with the spa water showing gentle underwater illumination'
    
    return 'NEW ZEALAND DAWN LIGHTING: Apply realistic pre-sunrise New Zealand dawn lighting with soft blue tones, gentle shadows, and the quiet, natural atmosphere of New Zealand\'s early morning'
  }

  useEffect(() => {
    processInitialPlacement()
  }, [])

  useEffect(() => {
    let tipInterval: number
    
    if (processing) {
      // Start tip cycling when processing begins
      tipInterval = setInterval(() => {
        setTipIndex((prevIndex) => (prevIndex + 1) % tips.length)
      }, 5000) // Change tip every 5 seconds
    }

    return () => {
      if (tipInterval) {
        clearInterval(tipInterval)
      }
    }
  }, [processing, tips.length])

  const processInitialPlacement = async () => {
    setProcessing(true)
    setError(null)
    
    try {
      const result = await processWithGemini(uploadedImage, selectedSpa, 'initial', undefined, undefined, getLightingPrompt(timeOfDay))
      setPosition(result.position)
      setResultImage(result.imageUrl)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleTimeChange = async () => {
    setProcessing(true)
    setError(null)
    
    try {
      const result = await processWithGemini(
        uploadedImage, 
        selectedSpa, 
        'adjust',
        'change lighting only - maintain current position',
        position,
        getLightingPrompt(timeOfDay),
        resultImage || undefined // Pass current result image for conversational editing
      )
      // Keep the same position since we're only changing lighting
      setResultImage(result.imageUrl)
    } catch (err) {
      setError('Failed to update lighting. Please try again.')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleQuickCommand = async (command: string) => {
    setProcessing(true)
    setError(null)
    
    try {
      const result = await processWithGemini(
        uploadedImage, 
        selectedSpa, 
        'adjust',
        command,
        position,
        getLightingPrompt(timeOfDay)
      )
      setPosition(result.position)
      setResultImage(result.imageUrl)
    } catch (err) {
      setError('Failed to adjust position. Please try again.')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleRegenerate = async () => {
    setProcessing(true)
    setError(null)
    
    try {
      const result = await processWithGemini(uploadedImage, selectedSpa, 'initial', undefined, undefined, getLightingPrompt(timeOfDay))
      setPosition(result.position)
      setResultImage(result.imageUrl)
    } catch (err) {
      setError('Failed to regenerate image. Please try again.')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return
    
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `spa-visualization-${Date.now()}.jpg`
    link.click()
  }


  return (
    <div className="visualizer">
      <div className="visualization-container">
        {processing && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>Processing your image...</p>
            <p className="processing-tip">💡 {tips[tipIndex]}</p>
          </div>
        )}
        
        {resultImage ? (
          <img 
            src={resultImage} 
            alt="Spa visualization" 
            className="result-image"
          />
        ) : (
          <img 
            src={uploadedImage.url} 
            alt="Original" 
            className="result-image"
          />
        )}
        
        {error && (
          <div className="error-overlay">
            <p>{error}</p>
            <button onClick={processInitialPlacement}>Retry</button>
          </div>
        )}
      </div>

      <div className="controls">
        <div className="adjustment-panel">
          <h3>Time of Day</h3>
          <div className="time-control">
            <div className="time-display">
              <span className="time-value">{formatTime12Hour(timeOfDay)} - {getTimeDescription(timeOfDay)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
              className="time-slider"
              disabled={processing}
            />
            <button
              className="time-apply-button"
              onClick={handleTimeChange}
              disabled={processing}
            >
              🌅 Apply Lighting
            </button>
          </div>
        </div>

        <div className="adjustment-panel">
          <h3>Adjust Position</h3>
          
          <div className="regenerate-section">
            <button 
              className="regenerate-button"
              onClick={handleRegenerate}
              disabled={processing}
            >
              🎲 Generate New Placement
            </button>
            <p className="regenerate-info">Try a different AI placement for your spa</p>
          </div>
          
          <div className="quick-commands">
            <button 
              onClick={() => handleQuickCommand('move left')}
              disabled={processing}
            >
              ← Move Left
            </button>
            <button 
              onClick={() => handleQuickCommand('move right')}
              disabled={processing}
            >
              Move Right →
            </button>
            <button 
              onClick={() => handleQuickCommand('move up')}
              disabled={processing}
            >
              ↑ Move Up
            </button>
            <button 
              onClick={() => handleQuickCommand('move down')}
              disabled={processing}
            >
              ↓ Move Down
            </button>
          </div>
        </div>

        <div className="output-panel">
          <h3>Save Results</h3>
          <div className="output-buttons">
            <button 
              className="download-button"
              onClick={handleDownload}
              disabled={!resultImage}
            >
              📥 Download Image
            </button>
          </div>
          
          <div className="spa-info">
            <h4>{selectedSpa.name}</h4>
            <p>Capacity: {selectedSpa.capacity} people</p>
            <p>Size: {selectedSpa.dimensions.length}m × {selectedSpa.dimensions.width}m</p>
            <p>Price: ${selectedSpa.price.toLocaleString()}</p>
            {selectedSpa.sku && <p>SKU: {selectedSpa.sku}</p>}
            {selectedSpa.productUrl && (
              <div className="product-link">
                <a 
                  href={selectedSpa.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-product-button"
                >
                  🔗 View Product Details
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Visualizer