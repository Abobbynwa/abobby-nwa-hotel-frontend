import React from 'react'
import '../styles/global.css'

const About = () => {
  return (
    <div className="about-page container" data-aos="fade-up">
      <h2 data-aos="fade-right">About Abobby Nwa Hotel & Suite</h2>

      <section className="about-section" data-aos="fade-up" data-aos-delay="200">
        <p>
          Abobby Nwa Hotel & Suite is a modern, elegant luxury hotel designed to give guests a peaceful, memorable, and premium hospitality experience.
          Located in the heart of Enugu captial cites , we are known for our stylish rooms, top-tier service, and exquisite ambiance.
        </p>
      </section>

      <section className="about-section" data-aos="fade-up" data-aos-delay="400">
        <h3>🏆 Our Mission</h3>
        <p>To provide exceptional comfort and outstanding service to every guest, every time.</p>
      </section>

      <section className="about-section" data-aos="fade-up" data-aos-delay="600">
        <h3>🌟 Our Vision</h3>
        <p>To become the leading name in African hospitality and redefine hotel luxury for our guests.</p>
      </section>
    </div>
  )
}

export default About
