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

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 800 })
  }, [])

  const heroSlides = [
    {
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      title: 'Welcome to Abobby Nwa Hotel & Suites',
      desc: 'Luxury meets comfort in every detail.',
    },
    {
      img: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d',
      title: 'Experience Pure Elegance',
      desc: 'Stay in our Deluxe & Executive rooms.',
    },
    {
      img: 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1',
      title: 'Relax in Presidential Style',
      desc: 'The finest stay in the city.',
    },
  ]

  const roomTypes = [
    {
      name: 'Standard',
      desc: 'Affordable comfort for travelers.',
      image: 'https://source.unsplash.com/600x400/?hotel,standard',
      link: '/rooms?category=standard',
    },
    {
      name: 'Deluxe',
      desc: 'Enhanced space with elegant decor.',
      image: 'https://source.unsplash.com/600x400/?hotel,deluxe',
      link: '/rooms?category=deluxe',
    },
    {
      name: 'Executive',
      desc: 'Business class service and privacy.',
      image: 'https://source.unsplash.com/600x400/?hotel,executive',
      link: '/rooms?category=executive',
    },
    {
      name: 'Presidential',
      desc: 'Unmatched luxury and exclusivity.',
      image: 'https://source.unsplash.com/600x400/?hotel,presidential',
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
