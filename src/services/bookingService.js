import API from './api'

const bookRoom = async (roomId, date) => {
  const res = await API.post(`/bookings`, { roomId, date })
  return res.data
}

export default { bookRoom }
