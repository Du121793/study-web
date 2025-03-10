import axios from 'axios'

// env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
// 路由參數
const API_URL = serverIp
const BASE_COURSE_URL = `${serverIp}/course`
const COURSE_URL = `${serverIp}/course/modifyCourse`
const QA_URL = `${serverIp}/course/question/modifyQA`
const QAMETHOD_URL = `${serverIp}/course/question/QAMethod`
const INDEX_URL = `${serverIp}/course/question`
const USER_URL = `${serverIp}/user`

const adminService = {
  // 創建新課程
  async createANewCourse(token, courseInfo) {
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(COURSE_URL + '/createNewCourse', courseInfo, {
        headers: authHeader,
      })
      return response.data
    } catch (e) {
      return e.response
    }
  },

  // 註冊該課程給成員
  async registerMember(token, registerInfo) {
    // console.log(registerInfo)
    // registeInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(COURSE_URL + '/register', registerInfo, {
        headers: authHeader,
      })
      return response.data
    } catch (e) {
      return e.response
    }
  },

  // 取消註冊該課程的成員
  async unRegisterMember(token, unRegisterInfo) {
    // unRegisterInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(COURSE_URL + '/unRegister', unRegisterInfo, {
        headers: authHeader,
      })
      return response.data
    } catch (e) {
      return e
    }
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

  // 獲得課程內的成員
  async getMembers(token, page, nameInput, phoneInput, gradeInput, roleInput, selectCourse) {
    const data = {
      realname: nameInput || null,
      phoneNumber: phoneInput || null,
      gradeInput: gradeInput || null,
      role: roleInput || null,
      page: page,
      courses: selectCourse || null,
    }
    console.log(data)
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/getMembers', {
      headers: authHeader,
      params: data,
    })
    console.log(response)
    return response.data
  },

  // 獲得課程
  async getCourses(token, page, pageSize, gradeInput, subjectInput, classInput, courseNameInput) {
    const data = {
      page,
      pageSize,
      grade: gradeInput || null,
      subject: subjectInput || null,
      courseClass: classInput || null,
      courseName: courseNameInput || null,
    }
    /* filter需要是物件
     { courseName, subject, grade, courseClass, members, _id, page, pageSize}*/
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(API_URL + '/course/getCourses', {
      headers: authHeader,
      params: data,
    })
    return response.data
  },

  // 獲得課程資訊清單
  async getCoursesInfoList(token, filter) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(COURSE_URL + '/findJoinedSubject', {
      headers: authHeader,
      params: filter,
    })
    return response.data
  },

  // 刪除課程
  async deleteCourse(token, courseId) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.delete(COURSE_URL + '/deleteCourse', {
      headers: authHeader,
      data: { course_id: courseId },
    })
    return response.data
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

  // 刪除成員
  async deleteMembers(token, userIds) {
    try {
      console.log(userIds)
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}

      const response = await axios.delete(USER_URL + '/deleteMember', {
        headers: authHeader,
        data: userIds,
      })

      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // 刪除影片
  async deleteVideo(token, videoId, courseID) {
    try {
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}

      const response = await axios.delete(BASE_COURSE_URL + `/${courseID}/deleteVideo`, {
        headers: authHeader,
        data: { videoId },
      })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },

  // 設定問題的公開狀態
  async commentPublicSetting(token, course_ids, question_id, isPublic) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      console.log(question_id)
      const payload = { course_ids, question_id, isPublic }
      console.log(QA_URL + `/patchQuestion`)
      const response = await axios.patch(QA_URL + `/patchQuestion`, payload, {
        headers: authHeader,
      })
      return response.data
    } catch (err) {
      console.error(err.response.data)
    }
  },

  // 刪除問題
  async removeQuestion(token, question_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { commentID }
      console.log(QA_URL + `/deleteQuestion`)
      const response = await axios.delete(QA_URL + `/deleteQuestion`, payload, {
        headers: authHeader,
      })
      return response.data
    } catch (err) {
      console.error(err.response.data)
    }
  },

  // 獲取公開QA的info
  async publicInfo(token, pageSize) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { pageSize }
      console.log(INDEX_URL + `/getPublicQAs`)
      const response = await axios.get(INDEX_URL + `/getPublicQAs`, {
        headers: authHeader,
        params: payload,
      })
      return response.data
    } catch (err) {
      console.error(err.response.data)
    }
  },
}

export default adminService
