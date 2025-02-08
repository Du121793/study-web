import axios from 'axios'

const API_URL = 'http://localhost:8080'
const COURSE_URL = `${API_URL}/course/modifyCourse`
const USER_URL = `${API_URL}/user`

const adminService = {
  async createANewCourse(token, courseInfo) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.post(COURSE_URL + '/createNewCourse', courseInfo, {
      headers: authHeader,
    })
    return response.data
  },
  async registerMember(token, registerInfo) {
    console.log(registerInfo)
    // registeInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.post(COURSE_URL + '/register', registerInfo, {
      headers: authHeader,
    })
    return response.data
  },

  async unRegisterMember(token, unRegisterInfo) {
    // unRegisterInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.post(COURSE_URL + '/unRegister', unRegisterInfo, {
      headers: authHeader,
    })
    return response.data
  },

  async findJoinedSubject(token, grade) {
    // grade是物件 存放{grade}
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/findJoinedSubject', {
      headers: authHeader,
      params: grade,
    })
    return response.data
  },

  async getMembers(token, filiter) {
    /* filiter需要是物件
     {username, phoneNumber, _id, role, courses}*/
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/getMembers', {
      headers: authHeader,
      params: filiter,
    })
    return response.data
  },

  async getCourses(token, filiter) {
    /* filiter需要是物件
     { courseName, subject, grade, courseClass, members, _id}*/
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(API_URL + '/course/getCourses', {
      headers: authHeader,
      params: filiter,
    })
    return response.data
  },
}

export default adminService
