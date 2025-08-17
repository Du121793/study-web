// 組件庫
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// method
import userService from '../../../../method/userService'

// style
import style from './style.module.css'

// env
const client_base_URL = process.env.NEXT_PUBLIC_CLIENT_IP
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function ShowMoreQA({ courseName, showMoreQA, setShowMoreQA, token, course_id, resourceCategory = null, hint = null }) {
  const image_base_url = `${server_base_URL}/resource/questionIMG/`
  const [visibility, setVisibility] = useState(false)
  //  請求參數
  const pageSize = Infinity

  // get response
  const [qaInfo, setQaInfo] = useState(null)

  // 請求獲得指定的tag的qa
  useEffect(() => {
    if (!token || !visibility) return
    if (resourceCategory === '' && token) {
      userService
        .getCourseQAsFromTag(token, course_id, pageSize, '無特定主題', hint)
        .then((res) => {
          setQaInfo(res.data)
        })
        .finally(() => {
          return
        })
    }
    if (hint === '' && token) {
      userService
        .getCourseQAsFromTag(token, course_id, pageSize, resourceCategory, '無特定主題')
        .then((res) => {
          setQaInfo(res.data)
        })
        .finally(() => {
          return
        })
    }
    userService
      .getCourseQAsFromTag(token, course_id, pageSize, resourceCategory, hint)
      .then((res) => {
        setQaInfo(res.data)
      })
      .finally(() => {
        return
      })
  }, [visibility])

  return (
    <div className={style['show-more-qa-main']}>
      <AnimatePresence>
        <div
          className="g-blue-btn"
          onClick={() => {
            setVisibility(true)
          }}>
          加載全部
        </div>
        {visibility && (
          <motion.div
            key={'container'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={style['qa-info-container']}>
            <motion.div
              key={'inner'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className={style['qa-info-area']}>
              <div className={style['top-btn-area']}>
                <button
                  className="g-red-btn"
                  onClick={() => {
                    setVisibility(false)
                  }}>
                  關閉
                </button>
              </div>

              <div className={style['info-container']}>
                {qaInfo &&
                  qaInfo.map((item, index) => (
                    <Link
                      style={{ color: 'black' }}
                      className={style['qa-card']}
                      href={`${client_base_URL}/courses/QaPage?qa_id=${item._id}&courseName=${courseName}`}
                      key={index}>
                      <div className={style['tag-area']}>
                        {resourceCategory && (
                          <div className={style['big-tag-area']}>
                            {item.resourceCategories.map((tagName, index) => (
                              <div
                                className={style['tag-content']}
                                key={index}>
                                {tagName === '' && '無主題'}
                                {tagName}
                              </div>
                            ))}
                          </div>
                        )}
                        {hint && (
                          <div className={style['big-tag-area']}>
                            {item.hints.map((tagName, index) => (
                              <div
                                className={style['tag-content']}
                                key={index}>
                                {tagName === '' && '無標籤'}
                                {tagName}
                              </div>
                            ))}
                          </div>
                        )}
                        {!resourceCategory && (
                          <div className={style['little-tag-area']}>
                            {item.resourceCategories.map((tagName, index) => (
                              <div
                                className={style['tag-content']}
                                key={index}>
                                {tagName === '' && '無特定主題'}
                                {tagName}
                              </div>
                            ))}
                          </div>
                        )}
                        {!hint && (
                          <div className={style['little-tag-area']}>
                            {item.hints.map((tagName, index) => (
                              <div
                                className={style['tag-content']}
                                key={index}>
                                {tagName === '' && '無特定標籤'}
                                {tagName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={style['image-area']}>
                        {item.image.map((url, index) => (
                          <Image
                            key={index}
                            src={`${image_base_url}${url}?token=${token.split(' ')[1]}`}
                            className={style['image']}
                            loading="lazy"
                            alt="qa image"
                            width={200}
                            height={200}
                            style={{ width: 'auto' }}
                          />
                        ))}
                      </div>
                      <div className={style['content-area']}>
                        <div className={style['time']}>
                          <div className={style['create-time']}>發布時間 : {new Date(item.date).toLocaleString()}</div>
                        </div>
                        <div
                          style={{
                            color: item?.replied === true ? 'rgb(114, 37, 255)' : 'blue',
                          }}
                          className={style['is-replied']}>
                          {item?.replied === true ? '已回覆' : '未回覆'}
                        </div>

                        <div className={style['description']}>{item.description}</div>
                      </div>
                    </Link>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
