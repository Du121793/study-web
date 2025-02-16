// userService.js (純函式，不用 Hook)
import axios from 'axios'

const API_URL = 'http://localhost:8080'
const COURSE_URL = `${API_URL}/course`
const USER_URL = `${API_URL}/user`

const userService = {
  // 獲得使用者資料
  async getUserInfo(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL, { headers: authHeader })
      return response.data.data
    } catch (error) {
      console.log(error)
    }
  },

  // 獲得使用者註冊過的所有課程的內容
  async getUserRegistedCourses(token, course_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL + '/registedCourse', {
        headers: authHeader,
        params: course_id,
      })
      return response.data.data
    } catch (e) {
      console.log(e)
    }
  },

  // 獲得課程裡面的影片，可以分頁
  async getVideoInfo(token, course_id, filter) {
    // {type, page = 1, pageSize = 10, sortBy, sortOrder ,noImg }
    // type 類型 MainClass為正課 QA為問答 noImg非必填 傳入true則不回傳縮圖
    // sortBy 排序欄位: length(影片長度) 或 recordDate(錄影日期)
    // sortOrder  排序順序 'asc'(正序) 或 'desc'(倒序)
    console.log(filter)
    try {
      const authHeader = token ? { Authorization: token } : {}
      console.log(COURSE_URL + `/${course_id}/videoInfo`)
      const response = await axios.get(COURSE_URL + `/${course_id}/videoInfo`, {
        headers: authHeader,
        params: filter,
      })
      console.log('msg', response.data.data)
      return response.data.data
    } catch (e) {
      console.log(e)
    }
  },

  async getVideoLink(token, course_id, video_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(COURSE_URL + `/${course_id}/videoUri`, {
        headers: authHeader,
        params: { videoId: video_id },
      })
      return response.data.data.embedLink
    } catch (e) {
      console.log(e)
    }
  },

  // 註冊使用
  async registerUser(tempToken, realname, phoneNumber) {
    try {
      const response = await axios.post(API_URL + '/auth/completeRegistration', {
        tempToken,
        realname,
        phoneNumber,
      })
      return response.data.data
    } catch (e) {
      return { success: false, msg: e.response.data.msg }
    }
  },
}

export default userService
