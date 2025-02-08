import axios from "axios";

const API_URL = "http://localhost:8080";
const COURSE_URL = `${API_URL}/course/modifyCourse`;
const USER_URL = `${API_URL}/user`;

const adminService = {
  async createANewCourse(token, courseInfo) {
    const authHeader = token ? { Authorization: token } : {};
    const response = await axios.post(
      COURSE_URL + "/createNewCourse",
      courseInfo,
      {
        headers: authHeader,
      }
    );
    return response.data;
  },
  async getMembers(token, filiter) {
    /* filiter需要是物件
     {username, phoneNumber, _id, role, courses}*/
    const authHeader = token ? { Authorization: token } : {};
    const response = await axios.get(USER_URL + "/getMembers", {
      headers: authHeader,
      params: filiter,
    });
    return response.data;
  },
  async getCourses(token, filiter) {
    /* filiter需要是物件
     { courseName, subject, grade, courseClass, members, _id}*/
    const authHeader = token ? { Authorization: token } : {};
    const response = await axios.get(API_URL + "/course/getCourses", {
      headers: authHeader,
      params: filiter,
    });
    return response.data;
  },
};

export default adminService;
