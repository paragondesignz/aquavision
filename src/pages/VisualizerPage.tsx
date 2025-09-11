import { useState } from 'react'
import ImageUpload from '../components/ImageUpload'
import SpaSelector from '../components/SpaSelector'
import Visualizer from '../components/Visualizer'
import { UploadedImage, SpaModel } from '../types'

function VisualizerPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [selectedSpa, setSelectedSpa] = useState<SpaModel | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'visualize'>('upload')

  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image)
    setCurrentStep('select')
  }

  const handleSpaSelect = (spa: SpaModel) => {
    setSelectedSpa(spa)
    setCurrentStep('visualize')
  }

  const handleBack = () => {
    if (currentStep === 'select') {
      setCurrentStep('upload')
    } else if (currentStep === 'visualize') {
      setCurrentStep('select')
    }
  }

  return (
    <div className="visualizer-page">
      <header className="page-header">
        <h1>
          <img src="/spa-images/logo white -trademark-small.png" alt="MSpa" className="header-logo" />
          AquaVision
        </h1>
        <div className="steps-indicator">
          <div className={`step ${currentStep === 'upload' ? 'active' : ''}`}>
            1. Upload Image
          </div>
          <div className={`step ${currentStep === 'select' ? 'active' : ''}`}>
            2. Select Spa
          </div>
          <div className={`step ${currentStep === 'visualize' ? 'active' : ''}`}>
            3. Visualize
          </div>
        </div>
      </header>

      <main className="page-content">
        {currentStep === 'upload' && (
          <ImageUpload onImageUpload={handleImageUpload} />
        )}
        
        {currentStep === 'select' && (
          <>
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <SpaSelector onSpaSelect={handleSpaSelect} />
          </>
        )}
        
        {currentStep === 'visualize' && uploadedImage && selectedSpa && (
          <>
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <Visualizer 
              uploadedImage={uploadedImage} 
              selectedSpa={selectedSpa} 
            />
          </>
        )}
      </main>
    </div>
  )
}

export default VisualizerPage