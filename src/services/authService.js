import API from './api'

export const loginService = async (email, password) => {
  const res = await API.post('/auth/login', { email, password })
  return res.data
}

export const registerService = async (data) => {
  const res = await API.post('/auth/register', data)
  return res.data
}
