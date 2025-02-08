// userService.js (純函式，不用 Hook)
import axios from "axios";

const API_URL = "http://localhost:8080";
const USER_URL = `${API_URL}/user`;

const userService = {
  async getUserInfo(token) {
    const authHeader = token ? { Authorization: token } : {};
    const response = await axios.get(USER_URL, { headers: authHeader });
    return response.data;
  },
  async getUserRegistedCourses(token) {
    try {
      const authHeader = token ? { Authorization: token } : {};
      const response = await axios.get(USER_URL + "/registedCourse", {
        headers: authHeader,
      });
      return response.data;
    } catch (e) {
      console.log(e);
    }
  },
};

export default userService;
