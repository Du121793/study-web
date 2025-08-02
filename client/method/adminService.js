import axios from 'axios'

// env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
// 路由參數
const API_URL = serverIp
const BASE_COURSE_URL = `${serverIp}/course`
const COURSE_URL = `${serverIp}/course/modifyCourse`
const QA_URL = `${serverIp}/course/question/modifyQA`
const INDEX_URL = `${serverIp}/course/question`
const USER_URL = `${serverIp}/user`
const SYSTEM_URL = serverIp + '/system'

// 登出函式
const signOut = () => {
  sessionStorage.removeItem('user_lineID')
  sessionStorage.removeItem('user_role')
  sessionStorage.removeItem('user_id')
  sessionStorage.removeItem('user_role')
  sessionStorage.removeItem('user_name')
  localStorage.removeItem('token')
  setTimeout(() => {
    window.location.replace('/')
  }, 100)
}

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

  // 註冊該課程給成員
  // let { user_ids, course_ids } = req.body;
  async registerMember(token, data) {
    // registeInfo 內存放 學生id陣列與課程id { user_ids, course_id }
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(COURSE_URL + '/register', data, {
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

  // grade是物件 存放{grade}
  async findJoinedSubject(token, grade) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL + '/findJoinedSubject', {
        headers: authHeader,
        params: grade,
      })
      if (response.status === 401) {
        signOut()
        return
      }
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

  // 獲得課程內的成員
  async getMembers(token, data) {
    /**
     * 獲取會員列表
     * @route GET /getMembers
     * @param {string} username - 用戶名稱過濾
     * @param {string} realname - 真實姓名過濾
     * @param {string} phoneNumber - 電話號碼過濾
     * @param {string} _id - 用戶ID過濾
     * @param {string} role - 角色過濾
     * @param {string} courses - 課程過濾
     * @param {string} withoutCourses - 排除特定課程的使用者
     * @param {string} grade - 年級過濾
     * @param {number} page - 頁碼
     * @param {number} pageSize - 每頁筆數
     * @param {string} sortBy - 排序欄位
     * @param {string} sortOrder - 排序方向
     * @returns {Object} 會員列表及分頁資訊
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL + '/getMembers', {
        headers: authHeader,
        params: data,
      })
      if (response.status === 401) {
        signOut()
        return
      }
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

  // 將選擇的成員匯出成csv
  async exportMembers(token, data) {
    /* const data = {
        realname: nameInput,
        phoneNumber: phoneInput,
        gradeInput: gradeInput,
        role: roleInput,
        courses: selectCourse,
        page: page,
        pageSize: pageSize,
    }*/
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios
        .get(USER_URL + '/exportMembers', {
          headers: authHeader,
          params: data,
          responseType: 'blob',
        })
        .then((response) => {
          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0') // 月份從 0 開始所以要 +1
          const day = String(now.getDate()).padStart(2, '0')
          const hour = String(now.getHours()).padStart(2, '0')
          const minute = String(now.getMinutes()).padStart(2, '0')
          const formattedTime = `${year}/${month}/${day}_${hour}-${minute}`

          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          // 設定下載檔名
          link.setAttribute('download', `${formattedTime}_members.csv`)
          // Date+time_members.csv
          document.body.appendChild(link)
          link.click()
          // 釋放記憶體
          window.URL.revokeObjectURL(url)
          return
        })
        .catch((e) => {
          if (e.response?.status === 401) {
            signOut()
            return
          }
          if (e.response?.data) {
            return e.response.data
          } else {
            return e
          }
        })
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

  // 獲得課程
  async getCourses(token, data) {
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
    /* filter需要是物件
     { courseName, subject, grade, courseClass, members, _id, page, pageSize}*/
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(API_URL + '/course/getCourses', {
        headers: authHeader,
        params: data,
      })
      if (response.status === 401) {
        signOut()
        return
      }
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

  // 獲得課程資訊清單
  async getCoursesInfoList(token, filter) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(COURSE_URL + '/findJoinedSubject', {
        headers: authHeader,
        params: filter,
      })
      if (response.status === 401) {
        signOut()
        return
      }
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

  // 刪除課程
  async deleteCourse(token, courseId) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(COURSE_URL + '/deleteCourse', {
        headers: authHeader,
        data: { course_id: courseId },
      })
      if (response.status === 401) {
        signOut()
        return
      }
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

  // 預註冊
  async preRegisterUser(token, users) {
    // users 是一個陣列 裝著物件 [{{userinfo} , role},...]
    const authHeader = token ? { Authorization: token } : {}
    try {
      const response = await axios.post(USER_URL + '/preRegisterUser', users, {
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

  // 刪除成員
  async deleteMembers(token, userIds) {
    try {
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(USER_URL + '/deleteMember', {
        headers: authHeader,
        data: userIds,
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

  // 刪除影片
  async deleteVideo(token, videoId, courseID) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(BASE_COURSE_URL + `/${courseID}/deleteVideo`, {
        headers: authHeader,
        data: { videoId },
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

  // 設定問題的公開狀態
  async commentPublicSetting(token, course_ids, question_id, isPublic, replied) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { course_ids, question_id, isPublic, replied }
      const response = await axios.patch(QA_URL + `/patchQuestion`, payload, {
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

  // commentId
  async setCommentBest(token, data, qa_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(serverIp + `/course/question/QAMethod/${qa_id}/patchComment`, data, {
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

  // 刪除問題
  async removeQuestion(token, question_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { question_id }
      const response = await axios.delete(QA_URL + `/deleteQuestion`, {
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

  async publicInfo(token, pageSize) {
    // 獲取公開QA的info
    try {
      const authHeader = token ? { Authorization: token } : {}
      const payload = { pageSize }
      const response = await axios.get(INDEX_URL + `/getPublicQAs`, {
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

  async editCourse(token, data) {
    // 編輯修改course
    // data = { courseId, courseName, subject, grade, courseClass }
    try {
      const authHeader = token ? { Authorization: token } : {}

      const response = await axios.patch(COURSE_URL + `/patchCourse`, data, {
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

  async addNewVideoAccess(token, course_id, data) {
    // 新增權杖
    // { accessName, videoIDs, studentIDs, accessDate, unlimited }
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(BASE_COURSE_URL + `/${course_id}/videoAccess/postNewAccess`, data, {
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

  async getAccessAllInfo(token, course_id, choseAccessId) {
    // 獲取所有權杖
    try {
      const data = {
        access_id: choseAccessId || undefined,
      }
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(BASE_COURSE_URL + `/${course_id}/videoAccess`, {
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

  async editAccessInfo(token, course_id, choseAccessId, data) {
    // 編輯權杖
    // Body 參數: { accessName, videoIDs, studentIDs, accessDate, unlimited }
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(BASE_COURSE_URL + `/${course_id}/videoAccess/patchAccess/${choseAccessId}`, data, {
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

  async deleteAccess(token, course_id, choseAccessId) {
    // 刪除權杖
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(BASE_COURSE_URL + `/${course_id}/videoAccess/deleteAccess/${choseAccessId}`, {
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

  async editVideoInfo(token, courseID, data) {
    // 編輯影片
    /* 
      data={
        videoID = videoID
        thumbnail = null
        title = ''
        description = null
        isPrivate = true || false
      }
    */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(BASE_COURSE_URL + `/${courseID}/patchVideo`, data, {
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

  async editQAInfo(token, data) {
    // 編輯QA
    /* 
      data =  {
          question_id,
          course_ids,
          isPublic,
          description,
          resourceCategories,
          hints,
          rmIMG,
          replied,
        } = req.body;
    */
    try {
      // 設定 Authorization 標頭，若 token 存在則加入
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(QA_URL + `/patchQuestion`, data, {
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

  async postCarousels(token, data) {
    //  {title, content}
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(API_URL + `/modifyResource/postNewCarousel`, data, {
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

  async deleteCarousels(token, data) {
    // 刪除輪播圖
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(API_URL + `/modifyResource/deleteCarousel`, {
        headers: authHeader,
        params: data,
      })

      return response.data
    } catch (e) {
      if (response?.status === 401) {
        signOut()
        return
      }
      if (e?.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  async postBoard(token, data) {
    // 新增公告
    /* 
    {
      title,
      content,
      poster: req.user._id,
      image: [],
    }
    */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(API_URL + `/modifyResource/postNewBoard`, data, {
        headers: authHeader,
      })

      return response.data
    } catch (e) {
      if (response?.status === 401) {
        signOut()
        return
      }
      if (e?.response?.data) {
        return e.response.data
      } else {
        return e
      }
    }
  },

  async deleteBoard(token, board_id) {
    // 刪除公告
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(API_URL + `/modifyResource/deleteBoard/${board_id}`, {
        headers: authHeader,
      })
      return response?.data
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

  async putBoard(token, data) {
    // 編輯公告
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.put(API_URL + `/modifyResource/putBoard`, data, {
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

  async batchCreate(token, data, course_id) {
    // 推送新增舊video
    // data = {videos : [{title,description,length(可選),recordDate(可選),isPrivate}]}
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(API_URL + `/course/${course_id}/vimeoMigrate/batchCreate`, data, {
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

  async updateUrls(token, data, course_id) {
    // data = {videoIds}
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(API_URL + `/course/${course_id}/vimeoMigrate/updateUrls`, data, {
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

  async getCourseQAsByTag(token, course_id) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(serverIp + `/course/question/getCourseTags/${course_id}`, {
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

  async addNewFolder(token, data) {
    /*
     * @param {string} name - 資料夾名稱
     * @param {string} parentFolder - 父資料夾ID
     * @returns {Object} 新創建的資料夾
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(API_URL + `/course/question/modifyQA/folder/createFolder`, data, {
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

  async patchQaToFolders(token, data) {
    /**
     * 修改問題
     * @route PATCH /patchQuestion
     * @param {string} question_id - 問題ID
     * @param {string[]} [course_ids] - 課程ID陣列
     * @param {boolean} [isPublic] - 是否公開，不傳則保留原有資料
     * @param {string} [description] - 問題描述，不傳則保留原有資料
     * @param {string[]} [resourceCategories] - 資源類別標籤，不傳則保留原有資料
     * @param {string[]} [hints] - 提示標籤，不傳則保留原有資料
     * @param {number[]} [rmIMG] - 要刪除的圖片索引陣列
     * @param {boolean} [replied] - 是否已回覆，不傳則保留原有資料
     * @param {Object[]} [image] - 上傳的新圖片檔案
     * @param {string[]} [folders] - 預上傳的資料夾位置
     * @returns {Object} 更新後的問題ID
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(QA_URL + `/patchQuestion`, data, {
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

  async deleteFolder(token, data) {
    /**
     * 刪除資料夾
     * @route DELETE /deleteFolder
     * @param {string} folder_id - 要刪除的資料夾ID
     * @returns {Object} 刪除結果
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(API_URL + `/course/question/modifyQA/folder/deleteFolder`, {
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

  async patchUserInfo(token, data) {
    /**
     * 修改用戶資料
     * @route PATCH /updateProfile
     * @param {string} username - 可選，用戶暱稱
     * @param {string} realname - 可選，真實姓名（僅限教師以上）
     * @param {string} phoneNumber - 可選，電話號碼（僅限教師以上）
     * @param {boolean} makeAnonymous - 可選，是否將圖片設為匿名
     * @returns {Object} 更新結果
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(API_URL + `/user/updateProfile`, data, {
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

  async patchUsersInfo(token, data) {
    /**
     * 修改單一會員資料
     * @route PATCH /patchMembers
     * @param {Array} memberId - 要修改的會員ID陣列
     * @param {Object} updateData - 要更新的資料
     * @param {string} updateData.username - 可選，用戶暱稱
     * @param {string} updateData.realname - 可選，真實姓名
     * @param {string} updateData.phoneNumber - 可選，電話號碼
     * @param {string} updateData.grade - 可選，年級
     * @param {string} updateData.role - 可選，角色
     * @returns {Object} 更新結果統計
     */
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(API_URL + `/user/patchMember`, data, {
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

  async changeRole(token, data) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(API_URL + `/user/changeRole`, data, {
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

  async getBackupList(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(SYSTEM_URL + '/getBackupList', {
        headers: authHeader,
      })
      if (response.status === 200) return response.data
    } catch (err) {
      if (err.response?.status === 401) {
        const message = {
          msg: '距離上次登陸超過24小時，請重新登錄',
        }
        return message
      }
      console.error(err)
    }
  },

  async downloadBackup(token, filename) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(SYSTEM_URL + `/getBackupFile/${filename}`, {
        headers: authHeader,
        responseType: 'blob',
      })
      if (response.status === 200) {
        return response.data
      }
    } catch (err) {
      if (err.response?.status === 401) {
        const message = {
          msg: '距離上次登陸超過24小時，請重新登錄',
        }
        return message
      }
      console.error(err)
    }
  },

  async runBackup(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(
        SYSTEM_URL + '/runBackup',
        {},
        {
          headers: authHeader,
        }
      )
      if (response.status === 200) return response.data
    } catch (err) {
      console.log(err)
      if (err.response?.status === 401) {
        const message = {
          status: 401,
          msg: '距離上次登陸超過24小時，請重新登錄',
          errorInfo: err,
        }
        return message
      }
      console.error(err)
    }
  },

  async applyBackup(token, filename, body) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(SYSTEM_URL + `/enableBackup/${filename}`, body, {
        headers: authHeader,
      })
      if (response.status === 200) return response.data
    } catch (err) {
      console.log(err)
      if (err.response?.status === 401) {
        const message = {
          status: 401,
          msg: '距離上次登陸超過24小時，請重新登錄',
          errorInfo: err,
        }
        return message
      }
      console.error(err)
    }
  },

  async deleteBackup(token, filename) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.delete(SYSTEM_URL + `/deleteBackupFile/${filename}`, {
        headers: authHeader,
      })
      if (response.status === 200) return response.data
    } catch (err) {
      console.log(err)
      if (err.response?.status === 401) {
        const message = {
          status: 401,
          msg: '距離上次登陸超過24小時，請重新登錄',
          errorInfo: err,
        }
        return message
      }
      console.error(err)
    }
  },
}

export default adminService
