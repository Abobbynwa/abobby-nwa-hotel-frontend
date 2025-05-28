// components/MapEmbed.jsx
import React from 'react'

const MapEmbed = () => {
  return (
    <div style={{ marginTop: '2rem' }}>
      <iframe
        title="map"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.114821067157!2d7.49695287499459!3d6.452087693537689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1044f3969f3537c9%3A0x578f1ae8c8c2e3c!2sEnugu%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1716201848567!5m2!1sen!2sng"
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  )
}

export default MapEmbed
