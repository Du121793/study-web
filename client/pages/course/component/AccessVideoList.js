import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// 
import { useUserToken } from '../../../method/useUserToken'
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessVideoList({ editStatus, setEditStatus, choseAccessId, course_id, showAccessVideoList, setShowAccessVideoList }) {
  const token = useUserToken()
  const router = useRouter()
  const [videos, setVideos] = useState()
  const [members, setMembers] = useState()
  const [choseAccessInfo, setChoseAccessInfo] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState([])
  const [student_id, setStudent_id] = useState([])

  const clickComplate = () => {
    // data = { accessName, videoIDs, studentIDs, accessDate, unlimited }
    let data = {
      accessName: choseAccessInfo.accessName,
      videoIDs: selectedVideo,
      studentIDs: student_id,
      accessDate: choseAccessInfo.accessDate,
      unlimited: choseAccessInfo.accessDate === null ? true : false,
    }
    adminService.editAccessInfo(token, course_id, choseAccessId, data).then((res) => {
      if (res.success === true) setEditStatus(!editStatus)
    })
  }

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

  /*
  1.獲得課程成員
  2.根據父組件的course_id, choseAccessId獲得指定權杖info
  */
  useEffect(() => {
    if (token && course_id) {
      let data = {
        course_id: course_id,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })

      adminService.getAccessAllInfo(token, course_id, choseAccessId).then((res) => {
        setChoseAccessInfo(res.data)
        let tempArray = []
        let studentTempArray = []
        res.data.studentIDs.forEach((item) => {
          studentTempArray.push(item._id)
        })
        setStudent_id(studentTempArray)
        res.data.videoIDs.forEach((item) => {
          tempArray.push(item._id)
        })
        setSelectedVideo(tempArray)
      })
    }
  }, [token, course_id, choseAccessId])

  const test = () => {
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
                        loading="lazy"
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
            setShowAccessVideoList(false)
            clickComplate()
          }}>
          完成並儲存
        </div>
      </div>
    </div>
  )
}
