import axios from "axios";

const API_URL = "http://localhost:8080";
const COURSE_URL = `${API_URL}/course`;
const USER_URL = `${API_URL}/user`;

const videoUploader = {
  async requestUploadLink(token, course_id, videoInfo) {
    const authHeader = token
      ? { "Content-Type": "application/json", Authorization: token }
      : {};
    const response = await axios.post(
      COURSE_URL + `/${course_id}/uploadVideo`,
      videoInfo,
      {
        headers: authHeader,
      }
    );
    return response.data;
  },

  async deleteVideo(token, course_id, videoId) {
    const authHeader = token
      ? { "Content-Type": "application/json", Authorization: token }
      : {};
    const response = await axios.delete(
      COURSE_URL + `/${course_id}/deleteVideo`,
      {
        headers: authHeader,
        params: { videoId },
      }
    );
    return response.data;
  },
};

export default videoUploader;
