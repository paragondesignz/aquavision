import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <header className="hero">
        <h1>MSpa AquaVision</h1>
        <p>Visualise your dream spa pool in your own backyard using AI</p>
        <button 
          className="cta-button"
          onClick={() => navigate('/visualizer')}
        >
          Get Started
        </button>
      </header>
      
      <section className="features">
        <div className="feature">
          <h3>Upload Your Photo</h3>
          <p>Take or upload a photo of your outdoor space</p>
        </div>
        <div className="feature">
          <h3>Choose Your Spa</h3>
          <p>Select from our range of spa pools</p>
        </div>
        <div className="feature">
          <h3>AI Placement</h3>
          <p>Our AI automatically places the spa in the perfect spot</p>
        </div>
      </section>
    </div>
  )
}

export default HomePage