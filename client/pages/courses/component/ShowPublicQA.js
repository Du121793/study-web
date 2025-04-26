// 組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// method
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'

// public
import home from '../../../public/course/home.png'
import close from '../../../public/course/close.png'
import folder from '../../../public/course/folder.png'
import rightArrow from '../../../public/course/rightArrow.png'

// env
const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP
export default function ShowPublicQA({ qaHasUpload, setQaHasUpload, token, showPublicQA, setShowPublicQA, course_name, course_id }) {
  const image_base_url = `${server_base_URL}/resource/questionIMG/`
  const [page_body, setPage_body] = useState([])
  const [userInfo, setUserInfo] = useState({})

  // session
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // get res
  const [rootFolder, setRootFolder] = useState({})
  const [ChildFolders, setChildFolders] = useState([])
  const [searchedQA, setSearchedQA] = useState([])

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

  // 移除QA
  const removeQA = (QAInfo) => {
    let tempFolders = QAInfo.folders.filter((item) => {
      return item !== nowFolder
    })

    let data = {
      question_id: QAInfo._id,
      folders: tempFolders,
    }
    adminService.patchQaToFolders(token, data).then((res) => {
      if (res?.success) {
        console.log(res)
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
      } else {
        console.log(res)
      }
    })
  }

  // 控制訊息
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }

    // 清除之前的 timer
    if (messageTimer.current) clearTimeout(messageTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)

    messageTimer.current = setTimeout(() => {
      setMessageStatus(false)
      resetTimer.current = setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
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

  const test = () => {
    console.log(QAsInfo)
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

  // scroll control
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  // get root
  useEffect(() => {
    if (token) {
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
          setTimeout(() => {
            if (!res) {
              setLoading(false)
              messageControl('回應超時，請稍後在試', false)
            }
          }, 3000)
          if (res?.success) {
            setQAsInfo(res.data)
            setLoading(false)
          }
        })
        .catch((err) => {
          console(err)
        })
    }
  }, [nowFolder])

  return (
    <div className="show-more-public-main">
      <div className="qa-info-area">
        {loading && (
          <div className="loading-main">
            <div className="loader"></div>
          </div>
        )}
        <div className="meesage-area">
          <div
            style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
            className="message">
            {message}
          </div>
        </div>
        <div className="btn-area">
          {/* 新增資料夾、刪除資料夾 按鈕 */}
          {userRole === 'admin' && (
            <div className="top-left-btn-area">
              <button
                className="g-blue-btn"
                onClick={() => {
                  setAddingFolder(true)
                }}>
                新增資料夾
              </button>
              <button
                className="g-red-btn"
                onClick={() => {
                  setRemoveingFolder(!removeingFolder)
                }}>
                刪除資料夾
              </button>
            </div>
          )}

          {/* 關閉視窗按鈕 */}
          <button
            className="g-red-btn"
            onClick={() => {
              page_body.style.overflow = 'scroll'
              setShowPublicQA(false)
            }}>
            <Image
              src={close}
              alt="close ui icon"
              width={18}
              height={18}></Image>
          </button>
        </div>

        {/* 點擊新增資料夾的input */}
        {userRole === 'admin' && addingFolder && (
          <div className="input-area">
            <div className="content">將新增至此資料夾底下</div>
            <div className="content">，新資料夾名稱:</div>
            <input
              type="text"
              onChange={(e) => {
                setNewFolderName(e.target.value)
              }}
            />
            <div
              className="g-blue-btn"
              onClick={() => {
                confirmAdd()
              }}>
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

        {/* 捷徑 */}
        <div className="shortcut-area">
          {shortcut &&
            shortcut.length > 0 &&
            shortcut.map((item, index) => (
              <div className="shortcut" key={index}>
                {item?.isRoot === true ? (
                  <Image
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      getChildFoldersById(rootFolder._id)
                      initShortcut(item)
                    }}
                    className="home-icon"
                    src={home}
                    alt="home icon"
                    width={28}
                    height={28}
                  />
                ) : (
                  <div
                    className="folder-area"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      getChildFoldersById(item._id, item)
                      initShortcut(item)
                    }}>
                    <Image
                      src={folder}
                      width={24}
                      height={24}
                      alt="folder icon"></Image>
                    <div className="name">{item.name}</div>
                  </div>
                )}
                {index < shortcut.length - 1 && (
                  <Image
                    style={{ marginRight: '-12px' }}
                    className="right-arrow-icon"
                    src={rightArrow}
                    width={24}
                    height={24}
                    alt="shortcut's right arrow icon"></Image>
                )}
              </div>
            ))}
        </div>

        {/* 資料夾顯示區 */}
        <div className="folder-area">
          {ChildFolders.length > 0 &&
            ChildFolders.map((item, index) => (
              <div
                className="folder-btn"
                key={index}
                onClick={() => {
                  initShortcut(item)
                  getChildFoldersById(item._id, item)
                }}>
                <div className="inner-content">
                  <Image
                    onClick={() => {
                      getChildFoldersById(item._id, item)
                      initShortcut(item)
                    }}
                    className="image"
                    src={folder}
                    width={24}
                    height={24}
                    alt="folder icon"></Image>
                  <div className="name">{item.name}</div>

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

        {/* 問題排序依據 */}
        <div className="sort-setting-area">
          <div
            className="g-red-btn"
            onClick={() => {
              setRemoveingQA(!removeingQA)
            }}>
            刪除問題
          </div>
        </div>

        {/* qa區域 */}
        <div className="qa-card-area">
          {QAsInfo &&
            QAsInfo.length > 0 &&
            QAsInfo.map((item, index) => (
              <Link
                href={`${client_URL}/courses/QaPage?qa_id=${item._id}&courseName=${course_name}&course_id=${course_id}`}
                className="card"
                onMouseOver={(e) => {
                  if (e.target.className === 'card') e.target.style.backgroundColor = ' #efefef'
                }}
                onMouseOut={(e) => {
                  if (e.target.className === 'card') e.target.style.backgroundColor = 'rgb(255, 255, 255)'
                }}
                onClick={(e) => {
                  if (e.target.className === 'card') page_body.style.overflow = 'auto'
                }}
                key={index}>
                <div className="label">
                  {item.hints &&
                    item.hints.length > 0 &&
                    item.hints.map((hint, idx) => {
                      if (idx < 3) {
                        return (
                          <div
                            className="hint"
                            key={idx}>
                            {hint}
                          </div>
                        )
                      }
                    })}
                  {item.resourceCategories &&
                    item.resourceCategories.length > 0 &&
                    item.resourceCategories.map((resourceCategories, idx) => {
                      if (idx < 3) {
                        return (
                          <div
                            className="resourceCategories"
                            key={idx}>
                            {resourceCategories}
                          </div>
                        )
                      }
                    })}
                </div>
                <div className="button-area">
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
                      e.stopPropagation()
                      e.preventDefault()
                      pushQAtoCourse(item)
                    }}>
                    加進此課程
                  </div>
                </div>
                <div className="content">問題描述</div>
                <div className="description-area">{item.description}</div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
