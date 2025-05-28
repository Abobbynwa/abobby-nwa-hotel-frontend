import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import '../styles/roomdetail.css'
import { getRoomById } from '../utils/roomData'

const RoomDetail = () => {
  const { id } = useParams()
  const [room, setRoom] = useState(null)

  useEffect(() => {
    AOS.init({ duration: 600 })
    const roomData = getRoomById(id)
    setRoom(roomData)
  }, [id])

  if (!room) return <p className="container">Loading room details...</p>

  return (
    <div className="container room-detail-page">
      <h2 className="section-title" data-aos="fade-down">🏨 {room.name}</h2>

      <div className="room-gallery">
        {room.images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Room ${i}`}
            data-aos="zoom-in"
            className="room-image"
          />
        ))}
      </div>

      <p className="room-detail-desc" data-aos="fade-up">{room.description}</p>

      <p className="room-price" data-aos="fade-up">
        <strong>₦{room.price}</strong> / night
      </p>

      <h4 className="section-subtitle" data-aos="fade-right">✅ Amenities:</h4>
      <ul className="amenities-list">
        {room.amenities.map((item, i) => (
          <li key={i} data-aos="fade-up" data-aos-delay={i * 100}>
            ✅ {item}
          </li>
        ))}
      </ul>

      <Link to={`/booking/${room.id}`} className="btn btn-glow" data-aos="fade-up" data-aos-delay="400">
        Book This Room
      </Link>
    </div>
  )
}

export default RoomDetail
