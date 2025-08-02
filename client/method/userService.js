// userService.js (純函式，不用 Hook)
import axios from 'axios'

// env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
const API_URL = serverIp
const COURSE_URL = `${serverIp}/course`
const USER_URL = `${serverIp}/user`
const QA_URL = `${serverIp}/course/question`

// 登出函式
const signOut = () => {
  localStorage.removeItem('user_lineID')
  localStorage.removeItem('user_role')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_role')
  localStorage.removeItem('user_name')
  localStorage.removeItem('token')
  setTimeout(() => {
    window.location.replace('/')
  }, 100)
}

const userService = {
  // 獲得使用者資料
  async getUserInfo(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL, { headers: authHeader })
      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  async getUserRegistedCourses(token, filter, course_id) {
    /**
     * 獲取用戶已註冊的課程
     * @route GET /registedCourse
     * @param {string} course_id - 可選，指定課程ID
     * @param {string|Object} filter - 可選，過濾條件（JSON格式）
     * @param {string} filter.search - 可選，搜索關鍵字，會同時搜索課程名稱和ID
     * @param {number} filter.page - 可選，分頁頁碼
     * @param {number} filter.pageSize - 可選，每頁筆數
     * @param {string} filter.courseName - 可選，課程名稱過濾
     * @param {string} filter.subject - 可選，科目過濾
     * @param {string} filter.grade - 可選，年級過濾
     * @param {string} filter.courseClass - 可選，班級過濾
     * @param {string} filter.date - 可選，日期過濾
     * @returns {Object} 課程資訊列表或單一課程詳情
     */
    try {
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}
      // 若 filter 為物件，則轉換為 JSON 字串傳遞給後端
      if (filter && typeof filter === 'object') {
        filter = JSON.stringify(filter)
      }
      // 構建 axios GET 請求的參數物件
      // 若 course_id 為 false 則不加入該參數
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
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
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
      const response = await axios.get(COURSE_URL + `/${course_id}/videoInfo`, {
        headers: authHeader,
        params: filter,
      })
      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 獲得影片連結，用於播放器頁面
  async getVideoLink(token, course_id, video_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(COURSE_URL + `/${course_id}/videoUri`, {
        headers: authHeader,
        params: { videoId: video_id },
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 註冊使用者
  async registerUser(tempToken, realname, phoneNumber) {
    let response = ''
    try {
      response = await axios.post(API_URL + '/auth/completeRegistration', {
        tempToken,
        realname,
        phoneNumber,
      })
      if (response?.data) {
        return response.data
      }
      return response
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 新增新的QA給指定課程
  async createNewQuestion(token, formData) {
    // isPublic, course_ids, description, image, resourceCategories, hints
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(QA_URL + '/modifyQA/postQuestion', formData, { headers: authHeader, 'Content-Type': 'multipart/form-data' })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
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
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 獲得課程的所有QA
  async getCourseQAs(token, course_id, data) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/getCourseQAs/${course_id}`, {
        headers: authHeader,
        params: data,
      })
      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
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
      const response = await axios.get(QA_URL + `/getCourseQAsByTag/${course_id}`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 獲得QA問題的留言區
  async getQaComment(token, qa_id, data) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/QAMethod/${qa_id}/getComment`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 新增新留言
  async submitQaMessage(token, question_id, reqBody) {
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(QA_URL + `/QAMethod/${question_id}/postNewComment`, reqBody, { headers: authHeader })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 獲得QA問題的詳細
  async getQaInfo(token, question_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(QA_URL + `/QAMethod/${question_id}`, {
        headers: authHeader,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // 刪除留言
  async deleteComment(token, question_id, comment_id) {
    try {
      const payload = {
        commentID: comment_id,
      }
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(QA_URL + `/QAMethod/${question_id}/deleteComment`, {
        headers: authHeader,
        params: payload,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // get輪播圖
  async getCarousels(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(API_URL + `/publicResource/carousel/all`, {
        headers: authHeader,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // get公告
  async getBoards(data) {
    try {
      const response = await axios.get(API_URL + `/publicResource/board`, {
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  // /board/:board_id
  async getBoardsById(id) {
    try {
      const response = await axios.get(API_URL + `/publicResource/board/${id}`)

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  async getFolderQuestions(token, data) {
    /**
     * 獲取指定資料夾下的所有問題
     * @route GET /getFolderQuestions
     * @param {string} folder_id - 資料夾ID
     * @param {number} [page=1] - 頁碼
     * @param {number} [pageSize=10] - 每頁筆數
     * @param {string} [sortBy="lastUpdate"] - 排序欄位，"createDate"或"lastUpdate"
     * @param {string} [sortOrder="asc"] - 排序方向，"asc"為升序，"desc"為降序
     * @param {string} [sortType="resourceCategories"] - 分群依據，"resourceCategories"或"hints"
     * @returns {Object} 按標籤分組的問題列表及分頁資訊
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(API_URL + `/course/question/modifyQA/folder/getFolderQuestions`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },
  async getRootFolder(token) {
    try {
      let data = {
        isRoot: true,
      }
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(API_URL + `/course/question/modifyQA/folder/getFolders`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  async getChildFolders(token, data) {
    /**
     * 獲取資料夾列表
     * @route GET /getFolders
     * @param {string} [folder_id] - 要查找子資料夾的父資料夾ID
     * @param {boolean} [isRoot=false] - 是否只獲取根資料夾
     * @returns {Object} 資料夾列表
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(API_URL + `/course/question/modifyQA/folder/getFolders`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (e.response?.status === 401) {
        signOut()
        return
      }
      if (e.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },
}

export default userService
