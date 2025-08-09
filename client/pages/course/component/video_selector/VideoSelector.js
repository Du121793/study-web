import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
// method
import { useUserToken } from '../../../../method/useUserToken'
import userService from '../../../../method/userService'

// component
import LoadingAnime from '../../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../../components/message_anime/MessageAnime'
// style
import style from './style.module.css'

export default function StudentSelector({ course_id, selectedVideo, setSelectedVideo, showVideoSelector, setShowVideoSelector }) {
  const token = useUserToken()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // 切換某個影片的選取狀態
  const clickVideo = (id) => {
    if (selectedVideo.includes(id)) {
      // 已選 -> 取消選
      setSelectedVideo(selectedVideo.filter((item) => item !== id))
    } else {
      // 未選 -> 加入選取
      setSelectedVideo([...selectedVideo, id])
    }
  }

  // 全選
  const selectAllStd = () => {
    const stdIdArr = videos.map((item) => {
      return item._id
    })
    setSelectedVideo(stdIdArr)
  }

  // 取影片清單
  useEffect(() => {
    if (token && course_id) {
      const data = {
        type: 'MainClass',
        pageSize: Infinity,
        course_id,
      }
      userService
        .getVideoInfo(token, course_id, data)
        .then((res) => {
          setVideos(res.data || [])
          setLoading(false)
        })
        .catch(() => setVideos([]))
    }
  }, [token, course_id])

  return (
    <AnimatePresence>
      <div
        className="g-blue-btn"
        onClick={() => setShowVideoSelector(true)}>
        選擇影片
      </div>

      {showVideoSelector && (
        <motion.div
          key="main-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowVideoSelector(false)}
          className={style['video-selector-main']}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={style['video-selector-container']}>
            {loading && <LoadingAnime></LoadingAnime>}
            {message && (
              <MessageAnime
                message={message}
                top="100px"
                duration={2000}></MessageAnime>
            )}
            <div className={style['title']}>選擇要授權的影片</div>

            <div className={style['info-area']}>
              {videos.map((item) => (
                <div
                  key={item._id}
                  // 根據 selectedVideo 來決定是否加上 active class
                  className={`${style['video-card']} ${selectedVideo.includes(item._id) ? style['active'] : ''}`}
                  onClick={() => clickVideo(item._id)}>
                  <Image
                    className={style['image']}
                    src={item.thumbnail}
                    alt="video shot"
                    quality={100}
                    width={0}
                    height={0}
                  />
                  <div className={style['info']}>{item.title}</div>
                </div>
              ))}
            </div>

            <div className={style['btn-area']}>
              <div
                className="g-blue-btn"
                onClick={() => {
                  selectAllStd()
                }}>
                全選
              </div>
              <div
                className="g-blue-btn"
                onClick={() => setShowVideoSelector(false)}>
                完成並儲存
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
