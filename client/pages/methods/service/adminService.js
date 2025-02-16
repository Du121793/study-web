import axios from 'axios'

const API_URL = 'http://localhost:8080'
const COURSE_URL = `${API_URL}/course/modifyCourse`
const USER_URL = `${API_URL}/user`

const adminService = {
  // 創建新課程
  async createANewCourse(token, courseInfo) {
    const authHeader = token ? { Authorization: token } : {}
    console.log(courseInfo)
    try {
      const response = await axios.post(COURSE_URL + '/createNewCourse', courseInfo, {
        headers: authHeader,
      })
      return response.data.data
    } catch (e) {
      return e.response.data
    }
  },

  // 註冊該課程給成員
  async registerMember(token, registerInfo) {
    console.log(registerInfo) 
    // registeInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(COURSE_URL + '/register', registerInfo, {
        headers: authHeader,
      })
      return response.data.data
    } catch (e) {
      return e.response.data
    }
  },

  // 取消註冊該課程的成員
  async unRegisterMember(token, unRegisterInfo) {
    // unRegisterInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.post(COURSE_URL + '/unRegister', unRegisterInfo, {
      headers: authHeader,
    })
    return response.data.data
  },

  async findJoinedSubject(token, grade) {
    // grade是物件 存放{grade}
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/findJoinedSubject', {
      headers: authHeader,
      params: grade,
    })
    return response.data.data
  },

  // 獲得課程內的成員
  async getMembers(token, filter) {
    /* filter需要是物件
     {username, phoneNumber, _id, role, courses}*/
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/getMembers', {
      headers: authHeader,
      params: filter,
    })
    return response.data.data
  },

  // 獲得課程
  async getCourses(token, filter) {
    /* filter需要是物件
     { courseName, subject, grade, courseClass, members, _id, page, pageSize}*/
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(API_URL + '/course/getCourses', {
      headers: authHeader,
      params: filter,
    })

    return response.data.data
  },

  // 獲得課程資訊清單
  async getCoursesInfoList(token, filter) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(COURSE_URL + '/findJoinedSubject', {
      headers: authHeader,
      params: filter,
    })
    return response.data.data
  },

  // 刪除課程
  async deleteCourse(token, courseId) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.delete(COURSE_URL + '/deleteCourse', {
      headers: authHeader,
      data: { course_id: courseId },
    })
    return response.data.data
  },

  // 預註冊
  async preRegisterUser(token, users) {
    // users 是一個陣列 裝著物件 [{{userinfo} , role},...]
    console.log(users)
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(USER_URL + '/preRegisterUser', users, {
        headers: authHeader,
      })
      return response.data
    } catch (e) {
      return e
    }
  },
}

export default adminService
