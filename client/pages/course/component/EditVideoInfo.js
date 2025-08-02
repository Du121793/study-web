import { useEffect, useState } from 'react'
import adminService from '../../../method/adminService'
import Image from 'next/image'
import { useStrictClickHandler } from '../../../method/userful'

export default function EditVideoInfo({ setLoading, video_info, getCourseVideos, messageControl, setShowEditVideoInfo, token, video_id, course_id }) {
  // 請求參數
  const [thumbnail, setThumbnail] = useState(video_info?.thumbnail)
  const [title, setTitle] = useState(video_info?.title)
  const [description, setDescription] = useState(video_info?.description)
  const [isPrivate, setIsPrivate] = useState(video_info?.isPrivate)
  // 預覽圖片
  const [preViewImage, setPreViewImage] = useState('')

  const strictClickCloseUI = useStrictClickHandler(() => {
    setShowEditVideoInfo(false)
  })

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
    setLoading(true)
    adminService.editVideoInfo(token, course_id, data).then((res) => {
      if (res.success) {
        setLoading(false)
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

  // 設定預覽圖
  useEffect(() => {
    if (video_info) {
      setPreViewImage(thumbnail)
    }
  }, [video_info])

  return (
    <div
      className="edit-video-main"
      {...strictClickCloseUI}>
      <div
        className="form-area"
        onClick={(e) => {
          e.stopPropagation()
        }}>
        <div
          className="title"
          onClick={test}>
          編輯影片
        </div>
        <div className="title-area">
          <div className="content">影片標題:</div>
          <input
            type="text"
            placeholder="必填"
            defaultValue={video_info?.title}
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
            accept=".jpg, .jpeg, .png"
            onChange={(e) => {
              const url = URL.createObjectURL(e.target.files[0])
              setThumbnail(e.target.files[0])
              setPreViewImage(url)
            }}
          />
        </div>
        {preViewImage && (
          <div className="pre-view-image-area">
            <Image
              alt="pre view image"
              className="image"
              src={preViewImage}
              width={0}
              height={0}></Image>
          </div>
        )}

        <div className="description-area">
          <div className="content">影片描述:</div>
          <textarea
            className="textarea"
            defaultValue={video_info?.description}
            placeholder="選填"
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
              name="isPublic"
              defaultChecked={video_info?.isPrivate ? true : false}
              onClick={() => {
                setIsPrivate(false)
              }}
            />
          </div>
          <div className="reject">
            <label>否</label>
            <input
              type="radio"
              name="isPublic"
              defaultChecked={!video_info?.isPrivate ? true : false}
              onClick={(e) => {
                setIsPrivate(true)
              }}
            />
          </div>
        </div>
        <div className="submit-area">
          <div
            className="g-blue-btn"
            onClick={submitEdit}>
            送出
          </div>
          <div
            className="g-red-btn"
            {...strictClickCloseUI}>
            關閉介面
          </div>
        </div>
      </div>
    </div>
  )
}
