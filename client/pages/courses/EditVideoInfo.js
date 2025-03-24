import { useState } from 'react'
import adminService from '../../method/adminService'

export default function EditVideoInfo({ getCourseVideos, messageControl, setShowEditVideoInfo, token, video_id, course_id }) {
  // 請求參數
  const [thumbnail, setThumbnail] = useState(null)
  const [title, setTitle] = useState(null)
  const [description, setDescription] = useState(null)
  const [isPrivate, setIsPrivate] = useState(false)

  const submitEdit = () => {
    if (title === null) {
      setShowEditVideoInfo(false)
      messageControl('標題不能為空', false)
      return console.error('title不能為空')
    }
    if (video_id === null || video_id === '') return console.error('出現錯誤')
    if (course_id === null || course_id === '') return console.error('出現錯誤')
    let data = {
      videoID: video_id,
      thumbnail: thumbnail || null,
      title: title,
      description: description || null,
      isPrivate: isPrivate,
    }
    adminService.editVideoInfo(token, course_id, data).then((res) => {
      if (res.success) {
        setShowEditVideoInfo(false)
        getCourseVideos(false)
        messageControl('編輯完成', true)
      } else {
        setShowEditVideoInfo(false)
        console.error(res)
        messageControl('發生錯誤編輯失敗', false)
      }
    })
  }
  const test = () => {}
  return (
    <div
      className="edit-video-main"
      onClick={() => {
        setShowEditVideoInfo(false)
      }}>
      <div
        className="form-area"
        onClick={(e) => {
          e.stopPropagation()
        }}>
        <div className="title">編輯影片</div>
        <div className="title-area">
          <div className="content">影片標題:</div>
          <input
            type="text"
            placeholder='必填'
            onChange={(e) => {
              setTitle(e.target.value)
            }}
          />
        </div>
        <div className="thumbnail-area">
          <div className="content">選擇縮圖 (可選)</div>
          <input
            type="file"
            className="file-input"
            accept="image/*"
            onChange={(e) => {
              setThumbnail(e.target.files[0])
            }}
          />
        </div>
        <div className="description-area">
          <div className="content">影片描述:</div>
          <textarea
            className="textarea"
            placeholder='選填'
            onChange={(e) => {
              setDescription(e.target.value)
            }}></textarea>
        </div>
        <div className="public-setting">
          <div className="content">是否公開此影片:</div>
          <div className="confirm">
            <label>是</label>
            <input
              type="radio"
              name="contact"
              value=""
              onClick={() => {
                setIsPrivate(false)
              }}
            />
          </div>
          <div className="reject">
            <label>否</label>
            <input
              type="radio"
              name="contact"
              value=""
              defaultChecked={true}
              onClick={(e) => {
                setIsPrivate(true)
              }}
            />
          </div>
        </div>
        <div className="submit-area">
          <div
            className="submit-btn"
            onClick={submitEdit}>
            送出
          </div>
        </div>
      </div>
    </div>
  )
}
