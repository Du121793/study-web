// 組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

// method
import userService from '../../../../method/userService'
import adminService from '../../../../method/adminService'

// public
import home from '../../../../public/course/home.png'
import close from '../../../../public/course/close.png'
import folder from '../../../../public/course/folder.png'
import rightArrow from '../../../../public/course/rightArrow.png'

// env
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP

// style
import style from './style.module.css'
export default function ShowPublicQA({ token, setShowPublicQASetting, question_id }) {
  const image_base_url = `${server_base_URL}/resource/questionIMG/`
  const [page_body, setPage_body] = useState([])

  // session
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // get res
  const [rootFolder, setRootFolder] = useState({})
  const [ChildFolders, setChildFolders] = useState([])

  //捷徑
  const [shortcut, setShortcut] = useState([])

  // 新增資料夾用
  const [nowFolder, setNowFolder] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [hasAddedFolder, setHasAddedFolder] = useState(false)

  //選擇資料夾用於新增QA
  const [selectedFolders, setSelectedFolders] = useState([])
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  const initSelectedFolder = () => {
    setSelectedFolders([])
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
  // 將QA新增到選擇到的folder
  const pushQAtoFolder = () => {
    /**
     * 修改問題
     * @route PATCH /patchQuestion
     * @param {string} question_id - 問題ID
     * @param {string[]} [course_ids] - 課程ID陣列，不傳則保留原有資料
     * @param {boolean} [isPublic] - 是否公開，不傳則保留原有資料
     * @param {string} [description] - 問題描述，不傳則保留原有資料
     * @param {string[]} [resourceCategories] - 資源類別標籤，不傳則保留原有資料
     * @param {string[]} [hints] - 提示標籤，不傳則保留原有資料
     * @param {number[]} [rmIMG] - 要刪除的圖片索引陣列
     * @param {boolean} [replied] - 是否已回覆，不傳則保留原有資料
     * @param {Object[]} [image] - 上傳的新圖片檔案
     * * @param {string[]} [folders] - 預上傳的資料夾位置，不傳則保留原有資料
     * @returns {Object} 更新後的問題ID
     */
    const folder_ids = []
    selectedFolders.forEach((item) => {
      folder_ids.push(item._id)
    })

    if (folder_ids.length > 0) {
      userService.getQaInfo(token, question_id).then((res) => {
        if (res?.success) {
          res.data.folders.forEach((item) => {
            folder_ids.push(item)
          })
          let data = {
            question_id: question_id,
            course_ids: res.data.courses,
            folders: folder_ids,
            isPublic: true,
          }
          adminService.patchQaToFolders(token, data).then((response) => {
            if (response?.success) {
              messageControl('新增成功', true)
              initSelectedFolder()
            } else {
              messageControl('新增失敗', false)
            }
          })
        }
      })
    } else {
      messageControl('請選擇要加入的資料夾', false)
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

  // 1. 將點擊的資料夾加進shorcut
  // 2. 拿到點擊的資料夾底下的所有資料夾
  const getChildFoldersById = (folder_id, folder = null) => {
    if (folder_id && folder) {
      setShortcut([...shortcut, folder])
    }
    if (folder_id) {
      let data = {
        folder_id: folder_id,
      }
      userService.getChildFolders(token, data).then((res) => {
        if (res?.success) setChildFolders(res.data)
      })
    }
  }

  // 留下點擊的路徑與之前的路徑，並且設定nowFolder
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

  return (
    <div className={style['show-more-public-main']}>
      <div className={style['qa-info-area']}>
        <div className={style['meesage-area']}>
          <div
            style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
            className={style['message']}>
            {message}
          </div>
        </div>

        <div className={style['btn-area']}>
          {userRole === 'admin' && (
            <button
              className={`${style['g-blue-btn']} ${style['clamp']}`}
              onClick={() => setAddingFolder(true)}>
              新增資料夾
            </button>
          )}
          <button
            className={style['g-red-btn']}
            onClick={() => {
              page_body.style.overflow = 'scroll'
              setShowPublicQASetting(false)
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
              className={style['g-blue-btn']}
              onClick={confirmAdd}>
              確定
            </div>
            <div
              className={style['g-red-btn']}
              onClick={() => {
                setAddingFolder(false)
                setNewFolderName('')
              }}>
              取消
            </div>
          </div>
        )}

        <div className={style['shortcut-area']}>
          {shortcut?.map((item, index) => (
            <div
              className={style['shortcut']}
              key={index}>
              {item?.isRoot ? (
                <Image
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    getChildFoldersById(rootFolder._id)
                    initShortcut(item)
                  }}
                  src={home}
                  className={style['home-icon']}
                  alt="home icon"
                  width={28}
                  height={28}
                />
              ) : (
                <div
                  className={style['folder-area']}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    getChildFoldersById(item._id, item)
                    initShortcut(item)
                  }}>
                  <Image
                    src={folder}
                    width={24}
                    height={24}
                    alt="folder icon"
                  />
                  <div className={style['name']}>{item?.name}</div>
                </div>
              )}
              {index < shortcut.length - 1 && (
                <Image
                  style={{ marginRight: '-12px' }}
                  className={style['right-arrow-icon']}
                  src={rightArrow}
                  width={24}
                  height={24}
                  alt="arrow icon"
                />
              )}
            </div>
          ))}
        </div>

        <div className={style['folder-area']}>
          {ChildFolders.map((item, index) => (
            <div
              key={index}
              className={style['folder-btn']}
              onClick={() => {
                initShortcut(item)
                getChildFoldersById(item._id, item)
              }}>
              <div className={style['inner-content']}>
                <Image
                  onClick={() => {
                    getChildFoldersById(item._id, item)
                    initShortcut(item)
                  }}
                  className={style['image']}
                  src={folder}
                  width={24}
                  height={24}
                  alt="folder icon"
                />
                <div className={style['name']}>{item.name}</div>
                <div
                  className={style['g-green-btn']}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (selectedFolders.find((f) => f._id === item._id)) return
                    setSelectedFolders([...selectedFolders, { name: item.name, _id: item._id }])
                  }}>
                  選擇
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={style['btn-area']}>
          <div
            className={`${style['g-blue-btn']} ${style['clamp']}`}
            onClick={pushQAtoFolder}>
            將問題新增到所選擇的資料夾
          </div>
        </div>

        <div className={style['selected-folder-area']}>
          {selectedFolders.map((item, index) => (
            <div
              className={style['slected-folder']}
              key={index}>
              <Image
                className={style['image']}
                src={folder}
                width={24}
                height={24}
                alt="folder icon"
              />
              <div className={style['content']}>{item.name}</div>
              <div
                className={style['g-red-btn']}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFolders(selectedFolders.filter((obj) => obj._id !== item._id))
                }}>
                刪除
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
