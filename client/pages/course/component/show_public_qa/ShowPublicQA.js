// 組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// method
import userService from '../../../../method/userService'
import adminService from '../../../../method/adminService'

// public
import home from '../../../../public/course/home.png'
import close from '../../../../public/course/close.png'
import folder from '../../../../public/course/folder.png'
import rightArrow from '../../../../public/course/rightArrow.png'
// style
import style from './style.module.css'
// env
const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP
export default function ShowPublicQA({ qaHasUpload, setQaHasUpload, token, course_name, course_id }) {
  const [page_body, setPage_body] = useState([])
  const [visibility, setVisibility] = useState(false)
  // session
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // get res
  const [rootFolder, setRootFolder] = useState(null)
  const [ChildFolders, setChildFolders] = useState([])

  //捷徑
  const [shortcut, setShortcut] = useState([])

  // 新增資料夾用
  const [nowFolder, setNowFolder] = useState(null)
  const [addingFolder, setAddingFolder] = useState(false)
  const [removeingFolder, setRemoveingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [hasAddedFolder, setHasAddedFolder] = useState(false)

  // get qa by folder
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(0)
  const [sortBy, setSortBy] = useState('lastUpdate')
  const [sortOrder, setSortOrder] = useState('asc')
  const [sortType, setSortType] = useState('resourceCategories')
  const [QAsInfo, setQAsInfo] = useState([])

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)
  // 刪除QA
  const [removeingQA, setRemoveingQA] = useState(false)
  //loading
  const [loading, setLoading] = useState(false)
  // 控制在請求成功後才渲染
  const [requesting, setRequesting] = useState(false)

  // 移除QA
  const removeQA = (QAInfo) => {
    let tempFolders = QAInfo.folders.filter((item) => {
      return item !== nowFolder
    })

    let data = {
      question_id: QAInfo._id,
      folders: tempFolders,
    }
    adminService
      .patchQaToFolders(token, data)
      .then((res) => {
        if (res?.success) {
          let tempData = {
            folder_id: nowFolder,
            page: page,
            pageSize: pageSize,
            sortBy: 'none',
            sortOrder: sortOrder,
            sortType: sortType,
          }
          userService.getFolderQuestions(token, tempData).then((res) => {
            setQAsInfo(res.data)
          })
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  // 移除資料夾
  const removeFolder = (folder_id) => {
    if (folder_id) {
      let data = {
        folder_id: folder_id,
      }
      adminService.deleteFolder(token, data).then((res) => {
        if (res?.success) {
          let tempData = {
            folder_id: nowFolder,
          }
          userService.getChildFolders(token, tempData).then((res) => {
            if (res?.success) setChildFolders(res.data)
          })
        }
      })
    }
  }

  // 新增資料夾
  const confirmAdd = () => {
    let data = {
      name: newFolderName,
      parentFolder: nowFolder,
    }
    adminService.addNewFolder(token, data).then((res) => {
      if (res?.success) {
        setHasAddedFolder(!hasAddedFolder)
        let responseData = {
          folder_id: nowFolder,
        }
        userService.getChildFolders(token, responseData).then((res) => {
          if (res?.success) setChildFolders(res.data)
        })
      }
    })
  }

  // 拿到點擊的資料夾底下的所有資料夾，將點擊的資料夾加進shorcut
  const getChildFoldersById = (folder_id, folder) => {
    if (folder_id) {
      setShortcut([...shortcut, folder])
      let data = {
        folder_id: folder_id,
      }
      userService.getChildFolders(token, data).then((res) => {
        if (res?.success) setChildFolders(res.data)
      })
    }
  }

  // 留下點擊的路徑與之前的路徑
  const initShortcut = (folder) => {
    setNowFolder(folder._id)
    let indexTemp = 0
    let foldersTemp = []
    // 先取得folder的index
    shortcut.forEach((item, index) => {
      if (item === folder) {
        indexTemp = index
      }
    })
    // 若是大於該index則不被存到temp
    shortcut.forEach((item, index) => {
      if (index <= indexTemp) {
        foldersTemp.push(item)
      }
    })
    setShortcut(foldersTemp)
  }

  const pushQAtoCourse = (qa_info) => {
    let courseIdsTemp = qa_info?.courses
    courseIdsTemp.push(course_id)
    let data = {
      question_id: qa_info._id,
      course_ids: courseIdsTemp,
    }
    adminService.patchQaToFolders(token, data).then((res) => {
      if (res?.success) {
        setQaHasUpload(!qaHasUpload)
      }
    })
  }

  const getRoot = () => {
    if (token) {
      setRequesting(true)
      setLoading(true)
      userService.getRootFolder(token).then((res) => {
        if (!res?.success) return
        setRootFolder(res.data.find((item) => item?.name === 'root'))
        setNowFolder(res.data.find((item) => item?.name === 'root')._id)
        const root = res.data.find((item) => item?.name === 'root')
        // 先將捷徑設為root
        setShortcut([root])
        // 檢查是否為root
        if (root?.isRoot === true) {
          let data = { folder_id: root._id }
          userService.getChildFolders(token, data).then((res) => {
            if (res?.success) {
              setChildFolders(res.data)
              setLoading(false)
              setRequesting(false)
            }
          })
        }
      })
    }
    if (nowFolder) {
      setLoading(true)
      setRequesting(true)
      let data = {
        folder_id: nowFolder,
        page: page,
        pageSize: pageSize,
        sortBy: sortBy,
        sortType: 'none',
        sortOrder: sortOrder,
      }

      userService
        .getFolderQuestions(token, data)
        .then((res) => {
          if (res.message === 'Network Error') {
          }
          setTimeout(() => {
            if (!res) {
              setLoading(false)
            }
          }, 3000)
          if (res?.success) {
            setQAsInfo(res.data)
            setLoading(false)
            setRequesting(false)
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  // session setting
  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    const role = sessionStorage.getItem('user_role')
    const user_id = sessionStorage.getItem('user_role')
    if (role) {
      setUserRole(role)
    }
    if (user_id) {
      setUserId(user_id)
    }
  }, [])

  // get root
  useEffect(() => {
    if (token) {
      setRequesting(true)
      setLoading(true)
      userService.getRootFolder(token).then((res) => {
        if (!res?.success) return
        setRootFolder(res.data.find((item) => item?.name === 'root'))
        setNowFolder(res.data.find((item) => item?.name === 'root')._id)
        const root = res.data.find((item) => item?.name === 'root')
        // 先將捷徑設為root
        setShortcut([root])
        // 檢查是否為root
        if (root?.isRoot === true) {
          let data = { folder_id: root._id }
          userService.getChildFolders(token, data).then((res) => {
            if (res?.success) {
              setChildFolders(res.data)
              setLoading(false)
              setRequesting(false)
            }
          })
        }
      })
    }
  }, [token])

  // get folder's qa
  useEffect(() => {
    if (nowFolder) {
      setLoading(true)
      setRequesting(true)
      let data = {
        folder_id: nowFolder,
        page: page,
        pageSize: pageSize,
        sortBy: sortBy,
        sortType: 'none',
        sortOrder: sortOrder,
      }

      userService
        .getFolderQuestions(token, data)
        .then((res) => {
          if (res.message === 'Network Error') {s
          }
          setTimeout(() => {
            if (!res) {
              setLoading(false)
            }
          }, 3000)
          if (res?.success) {
            setQAsInfo(res.data)
            setLoading(false)
            setRequesting(false)
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }, [nowFolder])

  return (
    <div className={style['show-more-public-main']}>
      <AnimatePresence>
        <div
          className={'g-blue-btn'}
          onClick={() => {
            setVisibility(true)
          }}>
          問題資料夾
        </div>
        {visibility && (
          <motion.div
            key={'contianer'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={style['show-more-public-container']}>
            <motion.div
              key={'inner'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={style['qa-info-area']}>
              <div className={style['btn-area']}>
                {userRole === 'admin' && (
                  <div className={style['top-left-btn-area']}>
                    <button
                      className="g-blue-btn"
                      onClick={() => setAddingFolder(true)}>
                      新增資料夾
                    </button>
                    <button
                      className="g-red-btn"
                      onClick={() => setRemoveingFolder(!removeingFolder)}>
                      刪除資料夾
                    </button>
                  </div>
                )}
                <button
                  className="g-red-btn"
                  onClick={() => {
                    setVisibility(false)
                  }}>
                  <Image
                    src={close}
                    alt="close ui icon"
                    width={18}
                    height={18}
                  />
                </button>
              </div>

              {userRole === 'admin' && addingFolder && (
                <div className={style['input-area']}>
                  <div className={style['content']}>將新增至此資料夾底下</div>
                  <div className={style['content']}>，新資料夾名稱:</div>
                  <input
                    type="text"
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <div
                    className="g-blue-btn"
                    onClick={confirmAdd}>
                    確定
                  </div>
                  <div
                    className="g-red-btn"
                    onClick={() => {
                      setAddingFolder(false)
                      setNewFolderName('')
                    }}>
                    取消
                  </div>
                </div>
              )}

              <div className={style['shortcut-area']}>
                {shortcut?.length > 0 &&
                  shortcut.map((item, index) => (
                    <div
                      className={style['shortcut']}
                      key={index}>
                      {item?.isRoot ? (
                        <Image
                          className={style['home-icon']}
                          onClick={() => {
                            getChildFoldersById(rootFolder._id)
                            initShortcut(item)
                          }}
                          style={{ cursor: 'pointer' }}
                          src={home}
                          alt="home icon"
                          width={28}
                          height={28}
                        />
                      ) : (
                        <div
                          className={style['folder-area']}
                          onClick={() => {
                            getChildFoldersById(item._id, item)
                            initShortcut(item)
                          }}
                          style={{ cursor: 'pointer' }}>
                          <Image
                            src={folder}
                            width={24}
                            height={24}
                            alt="folder icon"
                          />
                          <div className={style['name']}>{item.name}</div>
                        </div>
                      )}
                      {index < shortcut.length - 1 && (
                        <Image
                          className={style['right-arrow-icon']}
                          src={rightArrow}
                          width={24}
                          height={24}
                          alt="shortcut's right arrow icon"
                          style={{ marginRight: '-12px' }}
                        />
                      )}
                    </div>
                  ))}
              </div>

              <div className={style['folder-area']}>
                {ChildFolders.map((item, index) => (
                  <div
                    className={style['folder-btn']}
                    key={index}
                    onClick={() => {
                      initShortcut(item)
                      getChildFoldersById(item._id, item)
                    }}>
                    <div className={style['inner-content']}>
                      <Image
                        className={style['image']}
                        onClick={() => {
                          getChildFoldersById(item._id, item)
                          initShortcut(item)
                        }}
                        src={folder}
                        width={24}
                        height={24}
                        alt="folder icon"
                      />
                      <div className={style['name']}>{item.name}</div>
                      {removeingFolder && (
                        <div
                          className="g-light-red-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (e.target.innerText === '刪除') {
                              e.target.innerText = '確定刪除'
                              return
                            }
                            if (e.target.innerText === '確定刪除') removeFolder(item._id)
                          }}>
                          刪除
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={style['sort-setting-area']}>
                <div
                  className="g-red-btn"
                  onClick={() => setRemoveingQA(!removeingQA)}>
                  刪除問題
                </div>
              </div>

              <div className={style['qa-card-area']}>
                {QAsInfo.map((item, index) => (
                  <Link
                    key={index}
                    href={`${client_URL}/courses/QaPage?qa_id=${item._id}&courseName=${course_name}&course_id=${course_id}`}
                    className={style['card']}
                    onMouseOver={(e) => {
                      if (e.target.className === style['card']) e.target.style.backgroundColor = '#efefef'
                    }}
                    onMouseOut={(e) => {
                      if (e.target.className === style['card']) e.target.style.backgroundColor = '#ffffff'
                    }}
                    onClick={(e) => {
                      if (e.target.className === style['card']) page_body.style.overflow = 'auto'
                    }}>
                    <div className={style['label']}>
                      {item.hints?.slice(0, 3).map((hint, idx) => (
                        <div
                          className={style['hint']}
                          key={idx}>
                          {hint}
                        </div>
                      ))}
                      {item.resourceCategories?.slice(0, 3).map((cat, idx) => (
                        <div
                          className={style['resourceCategories']}
                          key={idx}>
                          {cat}
                        </div>
                      ))}
                    </div>
                    <div className={style['button-area']}>
                      {removeingQA && (
                        <div
                          className="g-light-red-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (e.target.innerText === '刪除') {
                              e.target.innerText = '確定刪除'
                              return
                            }
                            if (e.target.innerText === '確定刪除') removeQA(item)
                          }}>
                          刪除
                        </div>
                      )}
                      <div
                        className="g-blue-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          pushQAtoCourse(item)
                        }}>
                        加進此課程
                      </div>
                    </div>
                    <div className={style['content']}>問題描述</div>
                    <div className={style['description-area']}>{item.description}</div>
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
