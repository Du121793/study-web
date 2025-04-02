import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function StudentSelector({ course_id, selectedVideo, setSelectedVideo, showVideoSelector, setShowVideoSelector }) {
  const token = useUserToken()
  const router = useRouter()
  const [videos, setVideos] = useState()

  const clickVideo = (e, _id) => {
    e.classList.forEach((item) => {
      if (item === 'active') {
        e.classList.remove('active')
        setSelectedVideo(
          selectedVideo.filter((item) => {
            return item !== _id
          })
        )
      } else {
        e.classList.add('active')
        setSelectedVideo([...selectedVideo, _id])
      }
    })
  }

  useEffect(() => {
    if (token && course_id) {
      let data = {
        type: 'MainClass',
        pageSize: Infinity,
        course_id: course_id,
      }
      userService.getVideoInfo(token, course_id, data).then((res) => {
        setVideos(res.data)
      })
    }
  }, [token, course_id])

  const test = () => {
    console.log(videos)
  }
  return (
    <div className="video-selector-main">
      <div className="video-selector-container">
        <div
          className="title"
          onClick={test}>
          選擇要授權的影片
        </div>
        <div className="info-area">
          {videos &&
            videos.map((item, index) => {
              if (
                selectedVideo.find((id) => {
                  return id === item._id
                })
              ) {
                return (
                  <div
                    className="video-card active"
                    key={index}
                    onClick={(e) => {
                      clickVideo(e.target, item._id)
                    }}>
                    <div className="shot">
                      <Image
                        className="image"
                        src={item.thumbnail}
                        alt="video shot"
                        quality={100}
                        width={200}
                        height={120}></Image>
                    </div>
                    <div className="info">{item.title}</div>
                  </div>
                )
              } else {
                return (
                  <div
                    className="video-card"
                    key={index}
                    onClick={(e) => {
                      clickVideo(e.target, item._id)
                    }}>
                    <div className="shot">
                      <Image
                        src={item.thumbnail}
                        alt="video shot"
                        quality={100}
                        width={200}
                        height={120}></Image>
                    </div>
                    <div className="info">{item.title}</div>
                  </div>
                )
              }
            })}
        </div>
        <div
          className="finish-btn"
          onClick={() => {
            setShowVideoSelector(false)
          }}>
          完成並儲存
        </div>
      </div>
    </div>
  )
}
