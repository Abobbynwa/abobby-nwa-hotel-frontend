import React, { useState } from 'react'
import API from '../services/api'
import '../styles/contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const { data } = await API.post('/contact', formData)

      setSuccessMessage(
        data.message ||
        'Your message has been received. A confirmation has been sent to your email if email service is active.'
      )

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Contact form error:', error)
      const message =
        error.response?.data?.message ||
        error.message ||
        'Message failed to send. Please try again or contact us on WhatsApp.'

      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page container">
      <h2>📞 Contact Us</h2>
      <p className="contact-intro">
        Send us a message and our admin team will receive it directly. You will also get a confirmation at the email address you provide.
      </p>

      {successMessage && (
        <div className="contact-alert success-alert">
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="contact-alert error-alert">
          ❌ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="contact-form">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number (Optional)"
          value={formData.phone}
          onChange={handleChange}
        />

        <input
          type="text"
          name="subject"
          placeholder="Subject (Optional)"
          value={formData.subject}
          onChange={handleChange}
        />

        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
        />

        <button type="submit" className="btn btn-glow" disabled={loading}>
          {loading ? 'Sending Message...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}

export default Contact
