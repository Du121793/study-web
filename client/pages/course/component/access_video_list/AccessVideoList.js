// 原生組件
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
// method
import { useUserToken } from '../../../../method/useUserToken'
import adminService from '../../../../method/adminService'

// style
import style from './style.module.css'
// component
import LoadingAnime from '../../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../../components/message_anime/MessageAnime'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessVideoList({ setFatherMessage, allVdos, accessInfo, editStatus, setEditStatus, choseAccessId, course_id }) {
  const token = useUserToken()
  const [student_id, setStudent_id] = useState([])
  // UX
  const [visibility, setVisibility] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  // 找出目前ID的access setting info
  const [thisAccessInfo, setThisAccessInfo] = useState([])
  const [selectedVideo, setSelectedVideo] = useState([])

  const initMessage = () => {
    const timer = setTimeout(() => {
      setMessage('')
      setFatherMessage('')
    }, 2000)
    return () => clearTimeout(timer)
  }

  // 儲存更動
  const clickComplate = () => {
    console.log()
    if (!thisAccessInfo) return
    const data = {
      accessName: thisAccessInfo[0].accessName,
      videoIDs: selectedVideo,
      studentIDs: thisAccessInfo[0].studentIDs,
      accessDate: thisAccessInfo[0].accessDate,
      unlimited: thisAccessInfo[0].accessDate === null,
    }
    setLoading(true)
    adminService
      .editAccessInfo(token, course_id, choseAccessId, data)
      .then((res) => {
        if (res.success === true) {
          // 告訴父組件資料有改變
          setEditStatus(!editStatus)
          setVisibility(false)
          setFatherMessage('編輯成功')
        } else {
          setMessage('儲存失敗，發生錯誤')
          console.error(res)
        }
      })
      .catch((err) => {
        setMessage('發生錯誤')
        console.error(err)
      })
      .finally(() => {
        initMessage()
        setLoading(false)
      })
  }

  const clickVideo = (id) => {
    if (selectedVideo.includes(id)) {
      setSelectedVideo(selectedVideo.filter((item) => item !== id))
    } else {
      setSelectedVideo([...selectedVideo, id])
    }
  }

  // 找出目前ID的access setting info，用來比對選擇的學生
  useEffect(() => {
    if (!accessInfo || !choseAccessId) return
    const newArr = accessInfo.filter((item) => {
      return item._id === choseAccessId
    })
    setThisAccessInfo(newArr)
    setSelectedVideo(newArr[0].videoIDs.map((item) => item._id))
  }, [accessInfo, choseAccessId])

  return (
    <>
      <div
        className="g-blue-btn"
        onClick={() => setVisibility(true)}>
        授權影片清單
      </div>
      <AnimatePresence>
        {visibility && (
          <motion.div
            key={'container'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={style['video-selector-main']}
            onClick={() => {
              setVisibility(false)
            }}>
            <motion.div
              key={'inner'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={style['video-selector-container']}
              onClick={(e) => {
                e.stopPropagation()
              }}>
              {message && (
                <MessageAnime
                  message={message}
                  top="100px"
                  duration={2000}
                />
              )}
              {loading && <LoadingAnime></LoadingAnime>}
              <div className={style['title']}>選擇要授權的影片</div>
              <div className={style['info-area']}>
                {allVdos &&
                  allVdos.map((item, index) => {
                    return (
                      <div
                        className={`${style['video-card']} ${selectedVideo.includes(item._id) ? style['active'] : ''}`}
                        key={index}
                        onClick={() => {
                          clickVideo(item._id)
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
              <div className={style['btn-area']}>
                <div
                  className={`${style['finish-btn']} g-blue-btn`}
                  onClick={() => {
                    clickComplate()
                  }}>
                  完成並儲存
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
