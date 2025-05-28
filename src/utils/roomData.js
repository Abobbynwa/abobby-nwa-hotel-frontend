// utils/roomData.js

// 🖼️ Import local room images
import room1 from '../assets/room1.jpg'
import room2 from '../assets/room2.jpg'
import room3 from '../assets/room3.jpg'
import room4 from '../assets/room4.jpg'
import room5 from '../assets/room5.jpg'
import room6 from '../assets/room6.jpg'
import room7 from '../assets/room7.jpg'
import room8 from '../assets/room8.jpg'
import room9 from '../assets/room9.jpg'

export const getRoomById = (id) => {
  const idNum = parseInt(id)

  // 🔍 Match ID ranges to categories (based on your latest dataset)
  let type
  if (idNum >= 1 && idNum <= 10) type = 'standard'
  else if (idNum >= 11 && idNum <= 20) type = 'deluxe'
  else if (idNum >= 21 && idNum <= 30) type = 'executive'
  else if (idNum >= 31 && idNum <= 40) type = 'presidential'
  else return null // 🧱 invalid room ID fallback

  // 🖼️ Local image banks
  const imageBank = {
    standard: [room1, room2],
    deluxe: [room3, room4],
    executive: [room5, room6],
    presidential: [room7, room8, room9]
  }

  // 🎯 Amenities per category
  const amenitiesBank = {
    standard: ['Wi-Fi', 'AC'],
    deluxe: ['Wi-Fi', 'AC', 'Balcony'],
    executive: ['Wi-Fi', 'AC', 'TV', 'Balcony'],
    presidential: ['Wi-Fi', 'AC', 'TV', 'Balcony', 'Mini Bar']
  }

  // 💰 Price mapping
  const priceMap = {
    standard: 80000,
    deluxe: 120000,
    executive: 180000,
    presidential: 250000
  }

  return {
    id: idNum,
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Room`,
    price: priceMap[type],
    images: imageBank[type],
    amenities: amenitiesBank[type],
    description: `Welcome to our ${type} room – fully equipped with modern amenities and designed for your comfort and satisfaction.`
  }
}
