// 原生組件
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
// method
import { useUserToken } from '../../../../method/useUserToken'
import adminService from '../../../../method/adminService'
import userService from '../../../../method/userService'

// style
import style from './style.module.css'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessVideoList({ editStatus, setEditStatus, choseAccessId, course_id, showAccessVideoList, setShowAccessVideoList }) {
  const token = useUserToken()
  const [videos, setVideos] = useState()
  const [members, setMembers] = useState()
  const [choseAccessInfo, setChoseAccessInfo] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState([])
  const [student_id, setStudent_id] = useState([])

  const clickComplate = () => {
    const data = {
      accessName: choseAccessInfo.accessName,
      videoIDs: selectedVideo,
      studentIDs: student_id,
      accessDate: choseAccessInfo.accessDate,
      unlimited: choseAccessInfo.accessDate === null,
    }
    adminService.editAccessInfo(token, course_id, choseAccessId, data).then((res) => {
      if (res.success === true) setEditStatus(!editStatus)
    })
  }

  const clickVideo = (element, _id) => {
    element.classList.forEach((item) => {
      if (item === style['active']) {
        element.classList.remove(style['active'])
        setSelectedVideo(selectedVideo.filter((item) => item !== _id))
      } else {
        element.classList.add(style['active'])
        setSelectedVideo([...selectedVideo, _id])
      }
    })
  }

  useEffect(() => {
    if (token && course_id) {
      const data = {
        type: 'MainClass',
        pageSize: Infinity,
        course_id,
      }
      userService.getVideoInfo(token, course_id, data).then((res) => {
        setVideos(res.data)
      })
    }
  }, [token, course_id])

  useEffect(() => {
    if (token && course_id) {
      const data = { course_id }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })

      adminService.getAccessAllInfo(token, course_id, choseAccessId).then((res) => {
        setChoseAccessInfo(res.data)
        setStudent_id(res.data.studentIDs.map((item) => item._id))
        setSelectedVideo(res.data.videoIDs.map((item) => item._id))
      })
    }
  }, [token, course_id, choseAccessId])

  return (
    <div className={style['video-selector-main']}>
      <div className={style['video-selector-container']}>
        <div className={style['title']}>選擇要授權的影片</div>
        <div className={style['info-area']}>
          {videos &&
            videos.map((item, index) => {
              const isSelected = selectedVideo.includes(item._id)
              return (
                <div
                  className={`${style['video-card']} ${isSelected ? style['active'] : ''}`}
                  key={index}
                  onClick={(e) => {
                    clickVideo(e.currentTarget, item._id)
                  }}>
                  <div className={style['shot']}>
                    <Image
                      className={style['image']}
                      src={item.thumbnail}
                      loading="lazy"
                      alt="video shot"
                      quality={100}
                      width={200}
                      height={120}
                    />
                  </div>
                  <div className={style['info']}>{item.title}</div>
                </div>
              )
            })}
        </div>
        <div
          className={style['finish-btn']}
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
