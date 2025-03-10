// userService.js (純函式，不用 Hook)
import axios from 'axios'

// env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
const API_URL = serverIp
const COURSE_URL = `${serverIp}/course`
const USER_URL = `${serverIp}/user`
const QA_URL = `${serverIp}/course/question`

const userService = {
  // 獲得使用者資料
  async getUserInfo(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL, { headers: authHeader })
      return response.data
    } catch (error) {
      console.log(error)
    }
  },

  // 獲得使用者註冊過的所有課程的內容，可以依據 course_id 與 filter 進行查詢
  // 參數說明：
  // token      : 使用者驗證的 token
  // course_id  : 課程的 ID，若傳入則只查詢該筆課程資料（非 teacher 時需先檢查是否已註冊該課程）
  //              若 course_id 為 null 或其他 falsy 值，則不傳入此參數
  // filter     : 過濾條件與分頁參數，格式範例如下：
  //              {
  //                courseName: true,   // 若傳入 true，表示只回傳 courseName 欄位（其他允許的欄位：subject, grade, courseClass, members, date）
  //                page: 1,            // 分頁頁數，預設為 1
  //                pageSize: 10        // 每頁筆數，若未傳入則回傳所有資料
  //              }
  async getUserRegistedCourses(token, course_id, filter) {
    try {
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}

      // 若 filter 為物件，則轉換為 JSON 字串傳遞給後端
      if (filter && typeof filter === 'object') {
        filter = JSON.stringify(filter)
      }

      // 構建 axios GET 請求的參數物件
      // 若 course_id 為 falsy 則不加入該參數
      const params = { filter }
      if (course_id) {
        params.course_id = course_id
      }

      // 發送 GET 請求到 /registedCourse API，參數包含 course_id（若有）與 filter
      const response = await axios.get(USER_URL + '/registedCourse', {
        headers: authHeader,
        params,
      })

      // 回傳 API 回應的完整資料 (包含查詢結果與分頁資訊)
      return response.data
    } catch (e) {
      console.error(e)
      throw e
    }
  },

  // 獲得課程裡面的影片，可以分頁
  async getVideoInfo(token, course_id, filter) {
    // {type, page = 1, pageSize = 10, sortBy, sortOrder ,noImg }
    // type 類型 MainClass為正課 QA為問答 noImg非必填 傳入true則不回傳縮圖
    // sortBy 排序欄位: length(影片長度) 或 recordDate(錄影日期)
    // sortOrder  排序順序 'asc'(正序) 或 'desc'(倒序)
    try {
      const authHeader = token ? { Authorization: token } : {}
      console.log(COURSE_URL + `/${course_id}/videoInfo`)
      const response = await axios.get(COURSE_URL + `/${course_id}/videoInfo`, {
        headers: authHeader,
        params: filter,
      })
      return response.data
    } catch (e) {
      console.log(e.response.data)
    }
  },

  // 獲得影片連結，用於播放器頁面
  async getVideoLink(token, course_id, video_id) {
    console.log(course_id)
    console.log(video_id)
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(COURSE_URL + `/${course_id}/videoUri`, {
        headers: authHeader,
        params: { videoId: video_id },
      })
      return response.data
    } catch (e) {
      console.log(e)
    }
  },

  // 註冊使用者
  async registerUser(tempToken, realname, phoneNumber) {
    try {
      const response = await axios.post(API_URL + '/auth/completeRegistration', {
        tempToken,
        realname,
        phoneNumber,
      })
      return response.data
    } catch (e) {
      return e.response.data
    }
  },

  // 新增新的QA給指定課程
  async createNewQuestion(token, formData) {
    formData.forEach((value, key) => {
      console.log(key, value)
    })
    // isPublic, course_ids, description, image, resourceCategories, hints
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(QA_URL + '/modifyQA/postQuestion', formData, { headers: authHeader, 'Content-Type': 'multipart/form-data' })
      return response.data
    } catch (e) {
      console.log(e)
      return e.response.data
    }
  },

  // 獲得已公開(公開區)的QA
  async getPublicQA(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + '/getPublicQAs', {
        header: authHeader,
      })
      return response.data
    } catch (e) {
      return e.response.data
    }
  },

  // 獲得課程的所有QA
  async getCourseQAs(token, course_id, sortBy, pageSize) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/getCourseQAs/${course_id}`, {
        headers: authHeader,
        params: {
          sortType: sortBy,
          pageSize: pageSize || null,
        },
      })
      return response.data
    } catch (e) {
      console.log(e)
      return e
    }
  },

  // 獲得Tag的QA
  async getCourseQAsFromTag(token, course_id, pageSize, resourceCategory, hint) {
    try {
      const authHeader = token ? { Authorization: token } : {}

      const data = {
        resourceCategory: resourceCategory || null,
        hint: hint || null,
        pageSize: pageSize || null,
      }
      console.log(data.resourceCategory)
      console.log(data.hint)
      const response = await axios.get(QA_URL + `/getCourseQAsByTag/${course_id}`, {
        headers: authHeader,
        params: data,
      })
      return response.data
    } catch (err) {
      return err.response.data
    }
  },

  // 獲得QA問題的留言區
  async getQaComment(token, question_id) {
    try {
      console.log(QA_URL + `/QAMethod/getComment`)
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/QAMethod/${question_id}/getComment`, {
        headers: authHeader,
      })
      return response.data
    } catch (e) {
      return e
    }
  },

  // 新增新留言
  async submitQaMessage(token, question_id, reqBody) {
    console.log('即將送出 reqBody(FormData):', reqBody)
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(
        QA_URL + `/QAMethod/${question_id}/postNewComment`,
        reqBody, // 直接傳入 FormData
        { headers: authHeader } // 不要手動設定 Content-Type
      )
      console.log(response)
      return response.data
    } catch (e) {
      if (!e.response) {
        return { success: false, msg: '前端沒有接收到訊息' }
      }
      return e.response.data
    }
  },
  // 獲得QA問題的詳細
  async getQaInfo(token, question_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/QAMethod/${question_id}`, {
        headers: authHeader,
      })
      console.log(response.data)
      return response.data
    } catch (e) {
      return e
    }
  },
}

export default userService
