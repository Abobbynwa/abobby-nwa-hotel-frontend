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

// 🖼️ Local room images (you must have these in src/assets/)
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
    AOS.init({ duration: 800 })
  }, [])

  const heroSlides = [
    {
      img: room1,
      title: 'Welcome to Abobby Nwa Hotel & Suites',
      desc: 'Luxury meets comfort in every detail.',
    },
    {
      img: room2,
      title: 'Experience Pure Elegance',
      desc: 'Stay in our Deluxe & Executive rooms.',
    },
    {
      img: room3,
      title: 'Relax in Presidential Style',
      desc: 'The finest stay in the city.',
    },
  ]

  const roomTypes = [
    {
      name: 'Standard',
      desc: 'Affordable comfort for travelers.',
      image: room4,
      link: '/rooms?category=standard',
    },
    {
      name: 'Deluxe',
      desc: 'Enhanced space with elegant decor.',
      image: room5,
      link: '/rooms?category=deluxe',
    },
    {
      name: 'Executive',
      desc: 'Business class service and privacy.',
      image: room6,
      link: '/rooms?category=executive',
    },
    {
      name: 'Presidential',
      desc: 'Unmatched luxury and exclusivity.',
      image: room7,
      link: '/rooms?category=presidential',
    },
  ]

  return (
    <div className="home-container">
      {/* Hero Swiper */}
      <div className="hero-swiper">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 4000 }}
          loop
          slidesPerView={1}
        >
          {heroSlides.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="hero-slide" style={{ backgroundImage: `url(${slide.img})` }}>
                <div className="hero-overlay" />
                <div className="hero-content animate__animated animate__fadeInDown">
                  <h1>{slide.title}</h1>
                  <p>{slide.desc}</p>
                  <Link to="/rooms" className="btn btn-glow">Book Your Stay</Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Room Categories */}
      <section className="room-categories container" data-aos="fade-up">
        <h2 className="section-title">🛏️ Our Room Types</h2>
        <div className="categories-grid">
          {roomTypes.map((room, index) => (
            <Link to={room.link} className="category-box" key={index} data-aos="fade-up" data-aos-delay={index * 150}>
              <div className="image-wrapper">
                <img src={room.image} alt={room.name} />
              </div>
              <div className="category-info">
                <h3>{room.name}</h3>
                <p>{room.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials container" data-aos="fade-up">
        <h2 className="section-title">💬 Guest Reviews</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="100">
            <p>"This place was heaven. Perfect service, stunning views!"</p>
            <h4>— Linda O., 🇳🇬</h4>
          </div>
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="200">
            <p>"Definitely coming back! The Executive suite blew my mind."</p>
            <h4>— James K., 🇬🇧</h4>
          </div>
          <div className="testimonial-card" data-aos="fade-up" data-aos-delay="300">
            <p>"Super clean, quiet, and stylish. 10/10 recommend!"</p>
            <h4>— Chioma A., 🇺🇸</h4>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
