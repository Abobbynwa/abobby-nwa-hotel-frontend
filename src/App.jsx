import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Router from './router'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Navbar />
      <Router />
      <Footer />
    </AuthProvider>
  </BrowserRouter>
)

export default App
