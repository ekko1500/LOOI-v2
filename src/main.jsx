import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FaceRecognition from './component/FaceRecognition.jsx'
import BurmeseSpeechToText from './component/BurmeseSpeechToText.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <App/>
  </StrictMode>,
)
