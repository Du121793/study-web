// 原生組件庫
import { useEffect, useState } from 'react'
import Image from 'next/image'
// method
import adminService from '../../../../method/adminService'

import { useStrictClickHandler } from '../../../../method/userful'

// style
import style from './style.module.css'
export default function EditVideoInfo({ setContainerIndex, setLoading, video_info, getCourseVideos, messageControl, setShowEditVideoInfo, token, video_id, course_id }) {
  // 請求參數
  const [thumbnail, setThumbnail] = useState(video_info?.thumbnail)
  const [title, setTitle] = useState(video_info?.title)
  const [description, setDescription] = useState(video_info?.description)
  const [isPrivate, setIsPrivate] = useState(video_info?.isPrivate)
  // 預覽圖片
  const [preViewImage, setPreViewImage] = useState('')

  const strictClickCloseUI = useStrictClickHandler(() => {
    setShowEditVideoInfo(false)
    setContainerIndex('1')
  })

  const submitEdit = () => {
    if (title === null) {
      setShowEditVideoInfo(false)

      setContainerIndex('1')
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
        setContainerIndex('1')
        messageControl('編輯完成', true)
      } else {
        setShowEditVideoInfo(false)
        setContainerIndex('1')
        console.error(res)
        messageControl('發生錯誤編輯失敗', false)
      }
    })
  }

  // 設定預覽圖
  useEffect(() => {
    if (video_info) {
      setPreViewImage(thumbnail)
    }
  }, [video_info])

  return (
    <div
      className={style['edit-video-main']}
      {...strictClickCloseUI}>
      <div
        className={style['form-area']}
        onClick={(e) => {
          e.stopPropagation()
        }}>
        <div className={style['title']}>編輯影片</div>

        <div className={style['title-area']}>
          <div className={style['content']}>影片標題:</div>
          <input
            type="text"
            placeholder="必填"
            defaultValue={video_info?.title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
          />
        </div>

        <div className={style['thumbnail-area']}>
          <div className={style['content']}>選擇縮圖 (可選)</div>
          <input
            type="file"
            className={style['file-input']}
            accept=".jpg, .jpeg, .png"
            onChange={(e) => {
              const url = URL.createObjectURL(e.target.files[0])
              setThumbnail(e.target.files[0])
              setPreViewImage(url)
            }}
          />
        </div>

        {preViewImage && (
          <div className={style['pre-view-image-area']}>
            <Image
              alt="pre view image"
              className={style['image']}
              src={preViewImage}
              width={0}
              height={0}
            />
          </div>
        )}

        <div className={style['description-area']}>
          <div className={style['content']}>影片描述:</div>
          <textarea
            className={style['textarea']}
            defaultValue={video_info?.description}
            placeholder="選填"
            onChange={(e) => {
              setDescription(e.target.value)
            }}
          />
        </div>

        <div className={style['public-setting']}>
          <div className={style['content']}>是否公開此影片:</div>
          <div className={style['confirm']}>
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
          <div className={style['reject']}>
            <label>否</label>
            <input
              type="radio"
              name="isPublic"
              defaultChecked={!video_info?.isPrivate ? true : false}
              onClick={() => {
                setIsPrivate(true)
              }}
            />
          </div>
        </div>

        <div className={style['submit-area']}>
          <div
            className={'g-blue-btn'}
            onClick={submitEdit}>
            送出
          </div>
          <div
            className={'g-red-btn'}
            {...strictClickCloseUI}>
            關閉介面
          </div>
        </div>
      </div>
    </div>
  )
}
