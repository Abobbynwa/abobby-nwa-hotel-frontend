import React from 'react'

const RoomCard = ({ room }) => (
  <div className="room-card">
    <img src={room.image} alt={room.name} />
    <h3>{room.name}</h3>
    <p>${room.price} / night</p>
    <a href={`/rooms/${room.id}`} className="btn">View Details</a>
  </div>
)

export default RoomCard
