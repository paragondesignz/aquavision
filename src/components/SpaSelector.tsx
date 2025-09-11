import { useState } from 'react'
import { SpaModel } from '../types'
import { spaModels } from '../data/spaModels'

interface SpaSelectorProps {
  onSpaSelect: (spa: SpaModel) => void
}

function SpaSelector({ onSpaSelect }: SpaSelectorProps) {
  const [selectedSpa, setSelectedSpa] = useState<SpaModel | null>(null)

  const handleSpaClick = (spa: SpaModel) => {
    setSelectedSpa(spa)
  }

  const handleConfirm = () => {
    if (selectedSpa) {
      onSpaSelect(selectedSpa)
    }
  }

  return (
    <div className="spa-selector">
      <div className="spa-grid">
        {spaModels.map(spa => (
          <div 
            key={spa.id}
            className={`spa-card ${selectedSpa?.id === spa.id ? 'selected' : ''}`}
            onClick={() => handleSpaClick(spa)}
          >
            <img src={spa.imageUrl} alt={spa.name} className="spa-image" />
            <h3 className="spa-name">{spa.name}</h3>
            <div className="spa-details">
              <p>Capacity: {spa.capacity} people</p>
              <p>Size: {spa.dimensions.length}m × {spa.dimensions.width}m</p>
              <p className="spa-price">${spa.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedSpa && (
        <div className="selection-panel">
          <div className="selected-spa-info">
            <h3>Selected: {selectedSpa.name}</h3>
            <p>Capacity: {selectedSpa.capacity} people</p>
            <p>Price: ${selectedSpa.price.toLocaleString()}</p>
          </div>
          <button 
            className="confirm-button"
            onClick={handleConfirm}
          >
            Continue with {selectedSpa.name}
          </button>
        </div>
      )}
    </div>
  )
}

export default SpaSelector