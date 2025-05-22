import API from './api'

const getRooms = async () => {
  const res = await API.get('/rooms')
  return res.data
}

const getRoom = async (id) => {
  const res = await API.get(`/rooms/${id}`)
  return res.data
}

export default { getRooms, getRoom }
