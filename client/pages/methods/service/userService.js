// userService.js (純函式，不用 Hook)
import axios from "axios";

const API_URL = "http://localhost:8080";
const COURSE_URL = `${API_URL}/course`;
const USER_URL = `${API_URL}/user`;

const userService = {
  // 獲得使用者資料
  async getUserInfo(token) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.get(USER_URL, { headers: authHeader })
      return response.data
    } catch (error) {
      console.log(error);
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
      const authHeader = token ? { Authorization: token } : {};

      // 若 filter 為物件，則轉換為 JSON 字串傳遞給後端
      if (filter && typeof filter === "object") {
        filter = JSON.stringify(filter);
      }

      // 構建 axios GET 請求的參數物件
      // 若 course_id 為 falsy 則不加入該參數
      const params = { filter };
      if (course_id) {
        params.course_id = course_id;
      }

      // 發送 GET 請求到 /registedCourse API，參數包含 course_id（若有）與 filter
      const response = await axios.get(USER_URL + "/registedCourse", {
        headers: authHeader,
        params,
      });

      // 回傳 API 回應的完整資料 (包含查詢結果與分頁資訊)
      return response.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // 獲得課程裡面的影片，可以分頁
  async getVideoInfo(token, course_id, filter) {
    // {type, page = 1, pageSize = 10, sortBy, sortOrder ,noImg }
    // type 類型 MainClass為正課 QA為問答 noImg非必填 傳入true則不回傳縮圖
    // sortBy 排序欄位: length(影片長度) 或 recordDate(錄影日期)
    // sortOrder  排序順序 'asc'(正序) 或 'desc'(倒序)
    console.log(filter);
    try {
      const authHeader = token ? { Authorization: token } : {};
      console.log(COURSE_URL + `/${course_id}/videoInfo`);
      const response = await axios.get(COURSE_URL + `/${course_id}/videoInfo`, {
        headers: authHeader,
        params: filter,
      })
      console.log('msg', response.data)
      return response.data
    } catch (e) {
      console.log(e);
    }
  },

  async getVideoLink(token, course_id, video_id) {
    try {
      const authHeader = token ? { Authorization: token } : {};
      const response = await axios.get(COURSE_URL + `/${course_id}/videoUri`, {
        headers: authHeader,
        params: { videoId: video_id },
      })
      return response.data
    } catch (e) {
      console.log(e);
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
      return response.data
    } catch (e) {
      return e.response.data;
    }
  },
};

export default userService;
