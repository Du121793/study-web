// userService.js (純函式，不用 Hook)
import axios from 'axios'

const API_URL = 'http://localhost:8080'
const USER_URL = `${API_URL}/user`

const userService = {
  async getUserInfo(token) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL, { headers: authHeader })
    return response.data
  },
  // ...其他 API
}

export default userService
