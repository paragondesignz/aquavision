import { useState, useRef } from 'react'
import { UploadedImage } from '../types'

interface ImageUploadProps {
  onImageUpload: (image: UploadedImage) => void
}

function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or HEIC image')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB')
      return
    }

    setLoading(true)
    
    const url = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      const uploadedImage: UploadedImage = {
        file,
        url,
        width: img.width,
        height: img.height
      }
      setPreview(url)
      setLoading(false)
      onImageUpload(uploadedImage)
    }
    
    img.onerror = () => {
      setError('Failed to load image')
      setLoading(false)
    }
    
    img.src = url
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleExampleSelect = async (imagePath: string) => {
    setError(null)
    setLoading(true)
    
    try {
      // Fetch the example image
      const response = await fetch(imagePath)
      const blob = await response.blob()
      
      // Create a File object from the blob
      const file = new File([blob], imagePath.split('/').pop() || 'example.png', {
        type: blob.type || 'image/png'
      })
      
      // Create an image object to get dimensions
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const uploadedImage: UploadedImage = {
          file,
          url,
          width: img.width,
          height: img.height
        }
        setPreview(url)
        setLoading(false)
        onImageUpload(uploadedImage)
      }
      
      img.onerror = () => {
        setError('Failed to load example image')
        setLoading(false)
      }
      
      img.src = url
    } catch (error) {
      setError('Failed to load example image')
      setLoading(false)
    }
  }

  return (
    <div className="image-upload">
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-upload"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          id="camera-capture"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Uploaded preview" className="preview-image" />
            <button 
              className="change-image-button"
              onClick={handleButtonClick}
            >
              Change Image
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            {loading ? (
              <div className="loading">Processing image...</div>
            ) : (
              <>
                <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="upload-text">
                  Drag and drop your image here, or
                </p>
                <div className="upload-buttons">
                  <button 
                    className="upload-button camera-button"
                    onClick={handleCameraClick}
                  >
                    📱 Take Photo
                  </button>
                  <button 
                    className="upload-button file-button"
                    onClick={handleButtonClick}
                  >
                    📁 Browse Files
                  </button>
                </div>
                <p className="upload-info">
                  Supports JPEG, PNG, WebP, HEIC (max 20MB)
                </p>
                
                <div className="disclaimer">
                  <h4>ℹ️ Important Notice</h4>
                  <p>
                    This app is for <strong>visualisation and entertainment purposes only</strong>. 
                    It's not intended as a planning tool. The AI generator will sometimes give 
                    'interesting' results, but you can click the 'Generate New Placement' button 
                    to have another try. The positioning buttons will give you some loose control 
                    over the position.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>

      {/* Example Spaces Section */}
      <div className="example-spaces">
        <h3 className="example-spaces-title">Or try an example space</h3>
        <p className="example-spaces-subtitle">Click on an example below to get started quickly</p>
        <div className="example-spaces-grid">
          <div 
            className="example-space-card"
            onClick={() => handleExampleSelect('/spaces/deck1.png')}
          >
            <img src="/spaces/deck1.png" alt="Example deck space 1" className="example-space-image" />
            <p className="example-space-label">Modern Deck</p>
          </div>
          <div 
            className="example-space-card"
            onClick={() => handleExampleSelect('/spaces/deck2.png')}
          >
            <img src="/spaces/deck2.png" alt="Example deck space 2" className="example-space-image" />
            <p className="example-space-label">Garden Patio</p>
          </div>
          <div 
            className="example-space-card"
            onClick={() => handleExampleSelect('/spaces/deck 3.png')}
          >
            <img src="/spaces/deck 3.png" alt="Example deck space 3" className="example-space-image" />
            <p className="example-space-label">Outdoor Terrace</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload