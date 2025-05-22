import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global Styles
import './styles/global.css'
import 'animate.css'

// AOS for scroll animations
import AOS from 'aos'
import 'aos/dist/aos.css'

// Initialize AOS (must run once)
AOS.init({
  duration: 1000,
  once: true, // animation runs once per element
})
AOS.init({ duration: 1000, once: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

