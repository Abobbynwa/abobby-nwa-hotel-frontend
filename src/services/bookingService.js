import API from './api'

// Create a booking with full payload so base URL from api.js is used
const createBooking = async (bookingData) => {
  const res = await API.post('/bookings', bookingData)
  return res.data
}

export default { createBooking }
