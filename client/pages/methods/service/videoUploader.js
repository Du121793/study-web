import axios from 'axios'

const API_URL = 'http://localhost:8080'
const COURSE_URL = `${API_URL}/course`
const USER_URL = `${API_URL}/user`

const videoUploader = {
  async requestUploadLink(token, course_id, videoInfo) {
    try {
      const authHeader = token ? { 'Content-Type': 'application/json', Authorization: token } : {}
      const response = await axios.post(COURSE_URL + `/${course_id}/uploadVideo`, videoInfo, {
        headers: authHeader,
      })
      return response.data.data
    } catch (e) {
      throw { success: false, error: e }
    }
  },

  async returnUploadStatus(token, course_id, videoId, isUploadSuccess) {
    const reqObj = { isUploadSuccess, videoId }
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.patch(COURSE_URL + `/${course_id}/uploadVideoStatus`, reqObj, {
      headers: authHeader,
    })
    return response.data.data
  },
  
  async deleteVideo(token, course_id, videoId) {
    const authHeader = token ? { 'Content-Type': 'application/json', Authorization: token } : {}
    try {
      const response = await axios.delete(COURSE_URL + `/${course_id}/deleteVideo`, {
        headers: authHeader,
        params: { videoId },
      })
      return response.data.data
    } catch (e) {
      return e
    }
  },
}

export default videoUploader
