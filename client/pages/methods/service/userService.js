// userService.js (純函式，不用 Hook)
import axios from "axios";

const API_URL = "http://localhost:8080";
const COURSE_URL = `${API_URL}/course`;
const USER_URL = `${API_URL}/user`;

const userService = {
  async getUserInfo(token) {
    const authHeader = token ? { Authorization: token } : {};
    const response = await axios.get(USER_URL, { headers: authHeader });
    return response.data;
  },

  async getUserRegistedCourses(token, course_id) {
    try {
      const authHeader = token ? { Authorization: token } : {};
      const response = await axios.get(USER_URL + "/registedCourse", {
        headers: authHeader,
        params: course_id,
      });
      return response.data;
    } catch (e) {
      console.log(e);
    }
  },

  async getVideoInfo(token, course_id, filter) {
    // {type, page = 1, pageSize = 10, sortBy, sortOrder }
    // type 類型 MainClass為正課 QA為問答
    // sortBy 排序欄位: length(影片長度) 或 recordDate(錄影日期)
    // sortOrder  排序順序 'asc'(正序) 或 'desc'(倒序)

    try {
      const authHeader = token ? { Authorization: token } : {};
      console.log(COURSE_URL + `${course_id}/videoInfo`);
      const response = await axios.get(COURSE_URL + `${course_id}/videoInfo`, {
        headers: authHeader,
        params: filter,
      });
      return response.data;
    } catch (e) {
      console.log(e);
    }
  },

  async registerUser(tempToken, realname, phoneNumber) {
    try {
      const response = await axios.post(
        API_URL + "/auth/completeRegistration",
        {
          tempToken,
          realname,
          phoneNumber,
        }
      );
      return response.data;
    } catch (e) {
      console.log(e);
    }
  },
};

export default userService;
