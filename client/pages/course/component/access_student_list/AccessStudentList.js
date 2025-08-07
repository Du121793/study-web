import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// method
import { useUserToken } from '../../../../method/useUserToken'
import adminService from '../../../../method/adminService'

// component
import LoadingAnime from '../../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../../components/message_anime/MessageAnime'
// style
import style from './style.module.css'

export default function AccessStudentList({ setFatherMessage, allStds, accessInfo, choseAccessId, editStatus, setEditStatus, course_id }) {
  const token = useUserToken()
  // UX
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  // UI
  const [visibility, setVisibility] = useState(false)
  // 找出目前ID的access setting info
  const [thisAccessInfo, setThisAccessInfo] = useState([])
  const [selectedStudent, setSelectedStudent] = useState([])

  const initMessage = () => {
    const timer = setTimeout(() => {
      setMessage('')
      setFatherMessage('')
    }, 2000)
    return () => clearTimeout(timer)
  }

  // 切換學生選取
  const toggleStudent = (id) => {
    if (selectedStudent.includes(id)) {
      setSelectedStudent(selectedStudent.filter((item) => item !== id))
    } else {
      setSelectedStudent([...selectedStudent, id])
    }
  }

  // 完成並儲存
  const clickComplete = () => {
    if (!thisAccessInfo) return
    const data = {
      accessName: thisAccessInfo[0].accessName,
      videoIDs: thisAccessInfo[0].videoIDs,
      studentIDs: selectedStudent,
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
          setFatherMessage('編輯成功')
          setVisibility(false)
        } else {
          setMessage('儲存失敗，發生錯誤')
          console.error(res)
        }
      })
      .catch((err) => {
        setMessage('儲存失敗，發生錯誤')
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
        initMessage()
      })
  }

  // 找出目前ID的access setting info，用來比對選擇的學生
  useEffect(() => {
    if (!accessInfo || !choseAccessId) return
    const newArr = accessInfo.filter((item) => {
      return item._id === choseAccessId
    })
    setThisAccessInfo(newArr)
    setSelectedStudent(newArr[0].studentIDs.map((item) => item._id))
  }, [accessInfo, choseAccessId])

  return (
    <>
      <div
        className="g-blue-btn"
        onClick={() => setVisibility(true)}>
        授權學生清單
      </div>
      <AnimatePresence>
        {visibility && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={style['student-selector-main']}
            onClick={() => setVisibility(false)}>
            <motion.div
              key="inner"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              className={style['student-selector-container']}
              onClick={(e) => e.stopPropagation()}>
              {loading && <LoadingAnime></LoadingAnime>}
              {message && (
                <MessageAnime
                  message={message}
                  top="100px"
                  duration={2000}></MessageAnime>
              )}
              <div className={style['title']}>選擇要授權的成員</div>
              <div className={style['search-area']} />
              <div className={style['info-area']}>
                {allStds.map((member) => {
                  return (
                    <div
                      key={member._id}
                      className={`${style['member-info']} ${selectedStudent.includes(member._id) ? style['active'] : ''}`}
                      onClick={() => {
                        toggleStudent(member._id)
                      }}>
                      <div className={style['name']}>姓名: {member.userinfo.realname}</div>
                      <div className={style['role']}>學生</div>
                    </div>
                  )
                })}
              </div>
              <div className={style['btn-area']}>
                <div
                  className={`${style['finish-btn']} g-blue-btn`}
                  onClick={clickComplete}>
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
