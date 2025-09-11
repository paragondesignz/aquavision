import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VisualizerPage from './pages/VisualizerPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/visualizer" element={<VisualizerPage />} />
      </Routes>
    </div>
  )
}

export default App