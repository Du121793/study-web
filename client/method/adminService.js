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
      return e.response.data
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
  /* const data = {
        realname: nameInput,
        phoneNumber: phoneInput,
        gradeInput: gradeInput,
        role: roleInput,
        courses: selectCourse,
        page: page,
        pageSize: pageSize,
    }*/
  async getMembers(token, data) {
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.get(USER_URL + '/getMembers', {
      headers: authHeader,
      params: data,
    })
    return response.data
  },
  /*
  const data = {
    courseName: courseNameInput,
    grade: gradeInput,
    subject: subjectInput,
    courseClass: classInput,
    page,
    pageSize,
  }
  */

  // 獲得課程
  async getCourses(token, data) {
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
      console.log(BASE_COURSE_URL + `/${courseID}/deleteVideo`)
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
  async commentPublicSetting(token, course_ids, question_id, isPublic, replied) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { course_ids, question_id, isPublic, replied }
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
      const payload = { question_id }
      console.log(QA_URL + `/deleteQuestion`)
      const response = await axios.delete(QA_URL + `/deleteQuestion`, {
        headers: authHeader,
        params: payload,
      })
      return response.data
    } catch (err) {
      console.log(err.response)
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

  // 編輯修改course
  // data = { courseId, courseName, subject, grade, courseClass }
  async editCourse(token, data) {
    try {
      console.log(data)
      const authHeader = token ? { Authorization: token } : {}
      console.log(COURSE_URL + `/patchCourse`)
      const response = await axios.patch(COURSE_URL + `/patchCourse`, data, {
        headers: authHeader,
      })
      return response.data
    } catch (err) {
      console.error(err.response.data)
    }
  },

  // { accessName, videoIDs, studentIDs, accessDate, unlimited }
  async addNewVideoAccess(token, course_id, data) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      console.log(BASE_COURSE_URL + `/${course_id}/videoAccess/postNewAccess`)
      const response = await axios.post(BASE_COURSE_URL + `/${course_id}/videoAccess/postNewAccess`, data, {
        headers: authHeader,
      })
      return response.data
    } catch (err) {
      console.error(err.response.data)
    }
  },
}

export default adminService
