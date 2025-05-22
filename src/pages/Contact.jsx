import React, { useState } from 'react'
import '../styles/contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Contact form submitted:', formData)
    alert('Thanks for contacting us! We’ll be in touch.')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="contact-page container">
      <h2>📞 Contact Us</h2>
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
        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-glow">Send Message</button>
      </form>
    </div>
  )
}

export default Contact
