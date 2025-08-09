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

export default function StudentSelector({ course_id, selectedStudent, setSelectedStudent, showStudentSelector, setShowStudentSelector }) {
  const token = useUserToken()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  // 切換學生選取
  const toggleStudent = (id) => {
    if (selectedStudent.includes(id)) {
      setSelectedStudent(selectedStudent.filter((item) => item !== id))
    } else {
      setSelectedStudent([...selectedStudent, id])
    }
  }

  // 全選
  const selectAllStd = () => {
    const stdIdArr = members
      .filter((member) => member.role === 'student')
      .map((item) => {
        return item._id
      })
    setSelectedStudent(stdIdArr)
  }

  // 請求取得目前課程的學生
  useEffect(() => {
    if (!token || !course_id) return
    setLoading(true)
    const params = { courses: course_id }
    adminService
      .getMembers(token, params)
      .then((res) => {
        setMembers(res.data)
        setLoading(false)
      })
      .catch(() => setMembers([]))
  }, [token, course_id])

  useEffect(() => {})

  return (
    <>
      <AnimatePresence>
        <div
          className="g-blue-btn"
          onClick={() => setShowStudentSelector(true)}>
          選擇學生
        </div>
        {showStudentSelector && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowStudentSelector(false)}
            className={style['student-selector-main']}>
            <motion.div
              key={'inner'}
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
              <div className={style['info-area']}>
                {members
                  .filter((member) => member.role === 'student')
                  .map((member) => {
                    const isActive = selectedStudent.includes(member._id)
                    return (
                      <div
                        key={member._id}
                        className={`${style['member-info']} ${isActive ? style['active'] : ''}`}
                        onClick={() => toggleStudent(member._id)}>
                        <div className={style['name']}>姓名: {member.userinfo.realname}</div>
                        <div className={style['role']}>學生</div>
                      </div>
                    )
                  })}
              </div>
              <div className={style['btn-area']}>
                <div
                  className="g-blue-btn"
                  onClick={selectAllStd}>
                  全選
                </div>
                <div
                  className="g-blue-btn"
                  onClick={() => setShowStudentSelector(false)}>
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
