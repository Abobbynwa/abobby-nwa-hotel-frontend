import API from './api';

const getRooms = async (type = 'all', maxPrice = 500000) => {
  const res = await API.get(`/rooms?type=${type}&maxPrice=${maxPrice}`);
  return res.data;
};

const getRoom = async (id) => {
  const res = await API.get(`/rooms/${id}`);
  return res.data;
};

export default { getRooms, getRoom };