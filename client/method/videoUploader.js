import axios from 'axios'

// env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
const COURSE_URL = `${serverIp}/course`
const QA_URL = `${serverIp}/course/question`

const videoUploader = {
  async returnQuestionUploadStatus(token, question_id, commentID, isUploadSuccess) {
    try {
      const reqObj = { isUploadSuccess, commentID }
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.patch(QA_URL + `/QAMethod/${question_id}/uploadVideoStatus`, reqObj, {
        headers: authHeader,
      })
      return response
    } catch (e) {
      return e
    }
  },
  async requestUploadLink(token, course_id, formData) {
    try {
      const authHeader = token ? { Authorization: token } : {}
      const response = await axios.post(COURSE_URL + `/${course_id}/uploadVideo`, formData, {
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
  async returnQuestionUploadStatus(token, question_id, commentID, isUploadSuccess) {
    const reqObj = { isUploadSuccess, commentID }
    const authHeader = token ? { Authorization: token } : {}
    const response = await axios.patch(QA_URL + `/QAMethod/${question_id}/uploadVideoStatus`, reqObj, {
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
