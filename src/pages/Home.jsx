import React, { useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import { Autoplay, EffectFade } from 'swiper/modules'
import { Link } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import 'animate.css'

import '../styles/global.css'
import '../styles/home.css'

import room1 from '../assets/room1.jpg'
import room2 from '../assets/room2.jpg'
import room3 from '../assets/room3.jpg'
import room4 from '../assets/room4.jpg'
import room5 from '../assets/room5.jpg'
import room6 from '../assets/room6.jpg'
import room7 from '../assets/room7.jpg'
import room8 from '../assets/room8.jpg'
import room9 from '../assets/room9.jpg'

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  const heroSlides = [
    {
      img: room1,
      eyebrow: 'Premium comfort in Enugu',
      title: 'Abobby Nwa Hotel & Suites',
      desc: 'A refined stay experience with elegant rooms, flexible booking, and warm hospitality.',
    },
    {
      img: room2,
      eyebrow: 'Relax. Refresh. Reconnect.',
      title: 'Rooms Designed for Real Comfort',
      desc: 'Choose from standard, deluxe, executive, and presidential rooms built around your needs.',
    },
    {
      img: room3,
      eyebrow: 'Simple booking, smooth arrival',
      title: 'Book Your Stay in Minutes',
      desc: 'Reserve online, upload transfer evidence, and let admin confirm your stay quickly.',
    },
  ]

  const stats = [
    { value: '24/7', label: 'Guest support' },
    { value: '4+', label: 'Room categories' },
    { value: 'Secure', label: 'Booking process' },
    { value: 'Fast', label: 'Payment review' },
  ]

  const amenities = [
    'Comfortable rooms',
    'Online booking',
    'Transfer evidence upload',
    'Admin payment confirmation',
    'Clean environment',
    'Guest-friendly support',
  ]

  const roomTypes = [
    {
      name: 'Standard Room',
      desc: 'A clean, affordable room for simple and comfortable short stays.',
      image: room4,
      link: '/rooms?category=standard',
      price: 'From ₦50,000',
    },
    {
      name: 'Deluxe Suite',
      desc: 'More space, better comfort, and an upgraded atmosphere for relaxing stays.',
      image: room5,
      link: '/rooms?category=deluxe',
      price: 'From ₦120,000',
    },
    {
      name: 'Executive Room',
      desc: 'A premium option for guests who want privacy, style, and convenience.',
      image: room6,
      link: '/rooms?category=executive',
      price: 'From ₦200,000',
    },
    {
      name: 'Presidential Suite',
      desc: 'A luxury suite for special stays, private comfort, and a richer experience.',
      image: room7,
      link: '/rooms?category=presidential',
      price: 'From ₦400,000',
    },
  ]

  return (
    <div className="home-container">
      <section className="hero-swiper">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          loop
          slidesPerView={1}
        >
          {heroSlides.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="hero-slide" style={{ backgroundImage: `url(${slide.img})` }}>
                <div className="hero-overlay" />
                <div className="hero-content animate__animated animate__fadeInDown">
                  <span className="hero-eyebrow">{slide.eyebrow}</span>
                  <h1>{slide.title}</h1>
                  <p>{slide.desc}</p>
                  <div className="hero-actions">
                    <Link to="/rooms" className="btn btn-glow">Book Your Stay</Link>
                    <Link to="/contact" className="btn btn-soft">Contact Us</Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="booking-strip container" data-aos="fade-up">
        <div>
          <span className="strip-label">Ready to reserve?</span>
          <h2>Find a room that fits your comfort and budget.</h2>
        </div>
        <Link to="/rooms" className="strip-btn">Explore Rooms</Link>
      </section>

      <section className="stats-section container" data-aos="fade-up">
        {stats.map((item) => (
          <div className="stat-card" key={item.label}>
            <h3>{item.value}</h3>
            <p>{item.label}</p>
          </div>
        ))}
      </section>

      <section className="room-categories container" data-aos="fade-up">
        <div className="section-heading">
          <span>Room categories</span>
          <h2>Choose your perfect stay</h2>
          <p>Every room is arranged to make booking simple, payment traceable, and arrival smoother.</p>
        </div>

        <div className="categories-grid">
          {roomTypes.map((room, index) => (
            <Link to={room.link} className="category-box" key={room.name} data-aos="fade-up" data-aos-delay={index * 120}>
              <div className="image-wrapper">
                <img src={room.image} alt={room.name} />
                <span className="price-badge">{room.price}</span>
              </div>
              <div className="category-info">
                <h3>{room.name}</h3>
                <p>{room.desc}</p>
                <span className="view-room">View rooms →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="experience-section container" data-aos="fade-up">
        <div className="experience-copy">
          <span>Why guests choose us</span>
          <h2>Hospitality that feels organized, clean, and easy.</h2>
          <p>
            From browsing rooms to submitting payment evidence, Abobby Nwa Hotel & Suites gives guests a clear booking journey while admin manages every reservation from one dashboard.
          </p>
          <Link to="/rooms" className="btn btn-glow">Start Booking</Link>
        </div>
        <div className="amenities-grid">
          {amenities.map((item) => (
            <div className="amenity-card" key={item}>✓ {item}</div>
          ))}
        </div>
      </section>

      <section className="gallery-preview container" data-aos="fade-up">
        <div className="section-heading">
          <span>Inside the hotel</span>
          <h2>A glimpse of comfort</h2>
        </div>
        <div className="gallery-grid">
          {[room8, room9, room2].map((image, index) => (
            <img src={image} alt={`Hotel preview ${index + 1}`} key={index} />
          ))}
        </div>
      </section>

      <section className="testimonials container" data-aos="fade-up">
        <div className="section-heading">
          <span>Guest reviews</span>
          <h2>What guests say</h2>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="100">
            <p>"This place was comfortable, neat, and easy to book."</p>
            <h4>— Linda O.</h4>
          </div>
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="200">
            <p>"The room was quiet, clean, and the process was straightforward."</p>
            <h4>— James K.</h4>
          </div>
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="300">
            <p>"I liked how payment evidence and confirmation were handled."</p>
            <h4>— Chioma A.</h4>
          </div>
        </div>
      </section>

      <section className="final-cta container" data-aos="zoom-in">
        <h2>Book your next stay with confidence.</h2>
        <p>Explore available rooms, choose your dates, and reserve your space today.</p>
        <Link to="/rooms" className="btn btn-glow">Book Now</Link>
      </section>
    </div>
  )
}

export default Home
