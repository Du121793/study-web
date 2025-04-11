// 組件庫
import { useEffect, useState } from 'react'
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
export default function ShowPublicQA({ token, showPublicQA, setShowPublicQA, course_name, course_id }) {
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

  // 刪除QA
  const [removeingQA, setRemoveingQA] = useState(false)

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

  // 從指定id的folderId找到該id內的所有問題
  const getQAById = (folder_id) => {
    if (folder_id) {
      let data = {
        folder_id: folder_id,
        page: page,
        pageSize: pageSize,
        sortBy: 'none',
        sortOrder: sortOrder,
        sortType: sortType,
      }
      userService.getFolderQuestions(token, data).then((res) => {
        setQAsInfo(res.data)
      })
    } else {
      console.log('沒有id')
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
            }
          })
        }
      })
    }
  }, [token])

  // get folder's qa
  useEffect(() => {
    if (nowFolder) {
      let data = {
        folder_id: nowFolder,
        page: page,
        pageSize: pageSize,
        sortBy: sortBy,
        sortType: 'none',
        sortOrder: sortOrder,
      }
      userService.getFolderQuestions(token, data).then((res) => {
        if (res?.success) {
          console.log(res.data)
          setQAsInfo(res.data)
        }
      })
    } else {
      console.log('沒有id')
    }
  }, [nowFolder])

  return (
    <div className="show-more-public-main">
      <div className="qa-info-area">
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
              <div className="shortcut">
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
                    style={{ cursor: 'pointer' }}>
                    <Image
                      onClick={() => {
                        getChildFoldersById(item._id, item)
                        initShortcut(item)
                      }}
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
            className="content"
            defaultValue={'resourceCategories'}
            onChange={(e) => {
              setSortType(e.target.value)
            }}>
            問題排序依據
          </div>
          <select>
            <option value="resourceCategories">主題</option>
            <option value="hints">標籤</option>
          </select>
          <div className="space"></div>
          <select>
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
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
                key={index}>
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
                <div className="content">課程描述</div>
                <div className="description-area">{item.description}</div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
