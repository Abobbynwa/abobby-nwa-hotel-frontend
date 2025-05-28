import React from 'react'
import { FaEnvelope, FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa'
import MapEmbed from './MapEmbed' // <== Import map component
import '../styles/footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-info">
          <h3>📍 Abobby Nwa Hotel & Suites</h3>

          <div className="footer-contact">
            <p>
              <FaMapMarkerAlt /> Enugu, Enugu State, Nigeria
            </p>
            <p>
              <FaEnvelope />{' '}
              <a href="mailto:valentineagaba16@gmail.com">
                valentineagaba16@gmail.com
              </a>
            </p>
            <p>
              <FaWhatsapp />{' '}
              <a
                href="https://wa.me/2348149642220"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </a>
            </p>
          </div>
        </div>

        <div className="footer-map">
          <MapEmbed />
        </div>
      </div>

      <p className="footer-copy">
        © {new Date().getFullYear()} Abobby Nwa Hotel. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
