import React, { useEffect, useState } from 'react'
import '../styles/global.css'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useLocation } from 'react-router-dom'

const allRooms = [
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: 'Standard Room',
    price: 80,
    type: 'standard',
    image: 'https://source.unsplash.com/400x300/?room,standard'
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 31,
    name: 'Deluxe Room',
    price: 120,
    type: 'deluxe',
    image: 'https://source.unsplash.com/400x300/?room,deluxe'
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 61,
    name: 'Executive Suite',
    price: 180,
    type: 'executive',
    image: 'https://source.unsplash.com/400x300/?room,executive'
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 91,
    name: 'Presidential Suite',
    price: 250,
    type: 'presidential',
    image: 'https://source.unsplash.com/400x300/?room,presidential'
  })),
]

const Rooms = () => {
  const location = useLocation()
  const [category, setCategory] = useState('all')
  const [filteredRooms, setFilteredRooms] = useState([])

  useEffect(() => {
    AOS.init({ duration: 700 })

    const params = new URLSearchParams(location.search)
    const cat = params.get('category') || 'all'
    setCategory(cat)
  }, [location.search])

  useEffect(() => {
    const filtered = category === 'all'
      ? allRooms
      : allRooms.filter(room => room.type === category)

    setFilteredRooms(filtered)
  }, [category])

  const handleFilter = (cat) => {
    setCategory(cat)
    window.history.pushState({}, '', cat === 'all' ? '/rooms' : `/rooms?category=${cat}`)
  }

  return (
    <div className="container">
      <h2 className="section-title">🛏️ Explore Our Rooms</h2>

      <div className="room-filters">
        {['all', 'standard', 'deluxe', 'executive', 'presidential'].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${category === cat ? 'active' : ''}`}
            onClick={() => handleFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filteredRooms.length === 0 ? (
        <p>Loading rooms...</p>
      ) : (
        <div className="room-grid">
          {filteredRooms.map(room => (
            <div key={room.id} className="room-card" data-aos="fade-up">
              <img src={room.image} alt={room.name} />
              <h3>{room.name}</h3>
              <p><strong>${room.price}</strong> / night</p>
              <a href={`/rooms/${room.id}`} className="btn btn-outline">Book Now</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Rooms
