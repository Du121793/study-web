// 組件庫
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// method
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'

// env
const client_base_URL = process.env.NEXT_PUBLIC_CLIENT_IP
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function ShowPublicQA({ courseName, token, course_id, showPublicQA, setShowPublicQA, publicQAInfo, resourceCategory, hint }) {
  const image_base_url = `${server_base_URL}/resource/questionIMG/`
  const [page_body, setPage_body] = useState([])
  const [userInfo, setUserInfo] = useState({})

  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // get
  const [rootFolder, setRootFolder] = useState({})
  const [rootChildFolders, setRootChildFolders] = useState([])

  // 新增資料夾用
  const [nowFolder, setNowFolder] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [hasAddedFolder, setHasAddedFolder] = useState(false)

  const test = () => {}

  const confirmAdd = () => {
    let data = {
      name: newFolderName,
      parentFolder: nowFolder,
    }
    adminService.addNewFolder(token, data).then((res) => {
      if (res?.success) {
        setHasAddedFolder(!hasAddedFolder)
      }
    })
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

  useEffect(() => {
    if (token) {
      userService.getRootFolder(token).then((res) => {
        if (!res?.success) return
        setRootFolder(res.data.find((item) => item?.name === 'root'))
        setNowFolder(res.data.find((item) => item?.name === 'root')._id)
        const root = res.data.find((item) => item?.name === 'root')
        // 檢查是否為root
        if (root?.isRoot === true) {
          let data = { folder_id: root._id }
          userService.getChildFolders(token, data).then((res) => {
            if (res?.success) {
              setRootChildFolders(res.data)
            }
          })
        }
      })
    }
  }, [token, hasAddedFolder])

  return (
    <div
      className="show-more-public-main"
      onClick={test}>
      <div className="qa-info-area">
        <div
          className="close-ui-btn"
          onClick={() => {
            page_body.style.overflow = 'scroll'
            setShowPublicQA(!showPublicQA)
          }}>
          關閉
        </div>
        <div className="btn-area">
          {userRole === 'admin' && (
            <button
              className="g-blue-btn"
              onClick={() => {
                setAddingFolder(true)
              }}>
              新增資料夾
            </button>
          )}
        </div>
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
          </div>
        )}
        <div className="shortcut-area">
          {nowFolder === rootFolder._id ? <div className="content active">{rootFolder?.name === 'root' && 'root'}</div> : <div className="content">{rootFolder?.name === 'root' && 'root'}</div>}

          {rootChildFolders.length > 0 &&
            rootChildFolders.map((item, index) => (
              <div
                className="content"
                key={index}>
                {item.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
