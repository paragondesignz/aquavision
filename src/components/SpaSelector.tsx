import { useState } from 'react'
import { SpaModel } from '../types'
import { spaModels } from '../data/spaModels'

interface SpaSelectorProps {
  onSpaSelect: (spa: SpaModel) => void
}

function SpaSelector({ onSpaSelect }: SpaSelectorProps) {
  const [selectedSpa, setSelectedSpa] = useState<SpaModel | null>(null)
  const [filterSize, setFilterSize] = useState<'all' | 'small' | 'medium' | 'large'>('all')
  const [filterShape, setFilterShape] = useState<'all' | 'round' | 'square' | 'rectangular'>('all')

  const filteredModels = spaModels.filter(spa => {
    if (filterSize !== 'all') {
      const capacity = spa.capacity
      if (filterSize === 'small' && capacity > 4) return false
      if (filterSize === 'medium' && (capacity < 5 || capacity > 6)) return false
      if (filterSize === 'large' && capacity < 7) return false
    }
    
    if (filterShape !== 'all') {
      const { length, width } = spa.dimensions
      const ratio = length / width
      if (filterShape === 'square' && (ratio < 0.9 || ratio > 1.1)) return false
      if (filterShape === 'round' && (ratio < 0.9 || ratio > 1.1)) return false
      if (filterShape === 'rectangular' && ratio < 1.2) return false
    }
    
    return true
  })

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
      <div className="filters">
        <div className="filter-group">
          <label>Size:</label>
          <select 
            value={filterSize} 
            onChange={(e) => setFilterSize(e.target.value as any)}
          >
            <option value="all">All Sizes</option>
            <option value="small">Small (2-4 people)</option>
            <option value="medium">Medium (5-6 people)</option>
            <option value="large">Large (7+ people)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Shape:</label>
          <select 
            value={filterShape} 
            onChange={(e) => setFilterShape(e.target.value as any)}
          >
            <option value="all">All Shapes</option>
            <option value="round">Round</option>
            <option value="square">Square</option>
            <option value="rectangular">Rectangular</option>
          </select>
        </div>
      </div>

      <div className="spa-grid">
        {filteredModels.map(spa => (
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