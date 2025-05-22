import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const fakeData = {
  1: {
    id: 1,
    name: 'Deluxe Room',
    price: 120,
    images: [
      'https://source.unsplash.com/800x500/?hotel,room',
      'https://source.unsplash.com/800x500/?bedroom,hotel'
    ],
    description: 'A beautifully designed deluxe room with full amenities including a mini-fridge, workspace, Wi-Fi, and a balcony view.',
    amenities: ['Wi-Fi', 'TV', 'AC', 'Balcony', 'Mini Fridge']
  },
  2: {
    id: 2,
    name: 'Executive Suite',
    price: 180,
    images: [
      'https://source.unsplash.com/800x500/?luxury,hotel',
      'https://source.unsplash.com/800x500/?suite,hotel'
    ],
    description: 'Our Executive Suite offers luxury at its peak: king-size bed, private lounge, office desk, and skyline views.',
    amenities: ['Wi-Fi', 'Smart TV', 'Jacuzzi', 'Workspace', 'City View']
  }
}

const RoomDetail = () => {
  const { id } = useParams()
  const [room, setRoom] = useState(null)

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      setRoom(fakeData[id])
    }, 500)
  }, [id])

  if (!room) return <p className="container">Loading...</p>

  return (
    <div className="container">
      <h2>{room.name}</h2>

      <div className="room-gallery">
        {room.images.map((src, i) => (
          <img key={i} src={src} alt={`Room ${i}`} />
        ))}
      </div>

      <p className="room-detail-desc">{room.description}</p>

      <h4>Amenities:</h4>
      <ul className="amenities-list">
        {room.amenities.map((item, i) => (
          <li key={i}>✅ {item}</li>
        ))}
      </ul>

      <p><strong>${room.price}</strong> per night</p>
<br />
      <Link to={`/booking/${room.id}`} className="btn btn-glow">
        Book This Room
      </Link>
    </div>
  )
}

export default RoomDetail
