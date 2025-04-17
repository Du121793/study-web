// 組件庫
import { useState, useEffect, useRef } from 'react'

// 子組件
import Header from '../components/global/Header'
import Head from '../components/global/Globla'
import Footer from '../components/global/Footer'
// method
import { useUserToken } from '../method/useUserToken'
import userService from '../method/userService'
// component
import Board from './components/Board'
import Banner from './components/Banner'
import UploadBoard from './components/UploadBoard'
import UploadCarousel from './components/UploadCarousel'

export default function Index() {
  const token = useUserToken()
  const [isLogined, setLogined] = useState(false)
  const [userShot, setUserShot] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [showCarouselEdit, setShowCarouselEdit] = useState(false)
  const [showUploadBoardUI, setShowUploadBoardUI] = useState(false)
  const [uploadBoardUIHeight, setUploadBoardUIHeight] = useState(0)
  const [bannerHasChange, setBannerHasChange] = useState(false)
  const [boardhasChange, setBoardHasChange] = useState(false)
  const [editHasChange, setEditHasChange] = useState(false)
  // 用於開關UI時覆蓋所有內部元素
  const [visibility, setVisibility] = useState('visible')
  // 移動到最新消息function
  const moveToBoardRef = useRef(null)
  // session 設定
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          if (!res?.data?.userinfo) {
            return
          }
          if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_lineID') || !sessionStorage.getItem('user_line_shot') || sessionStorage.getItem('user_id')) {
            sessionStorage.setItem('user_lineID', res.data.lineID)
            sessionStorage.setItem('user_id', res.data._id)
            sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
            sessionStorage.setItem('user_role', res.data.role)
            sessionStorage.setItem('user_name', res.data.userinfo.username)
            setUserShot(res.data.userinfo.pictureUrl)
          }
          setUserRole(res.data.role)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  const callBoardMoveToBoardFunction = () => {
    if (moveToBoardRef.current) moveToBoardRef.current.doSomething()
  }

  const test = () => {}

  return (
    <div className="index-main">
      <Head></Head>
      <div className="RWD">
        {showCarouselEdit && (
          <UploadCarousel
            showCarouselEdit={showCarouselEdit}
            setShowCarouselEdit={setShowCarouselEdit}
            bannerHasChange={bannerHasChange}
            setBannerHasChange={setBannerHasChange}
          />
        )}
        {showUploadBoardUI && (
          <UploadBoard
            editHasChange={editHasChange}
            setEditHasChange={setEditHasChange}
            visibility={visibility}
            setVisibility={setVisibility}
            setShowUploadBoardUI={setShowUploadBoardUI}
            setUploadBoardUIHeight={setUploadBoardUIHeight}
            uploadBoardUIHeight={uploadBoardUIHeight}
          />
        )}
        <Header
          callBoardMoveToBoardFunction={callBoardMoveToBoardFunction}
          loginState={isLogined}
          user_line_shot={userShot}></Header>
        <Banner bannerHasChange={bannerHasChange}></Banner>
        {userRole && userRole === 'admin' && (
          <div className="g-btn-area">
            <div
              className="g-blue-btn"
              onClick={() => {
                setShowCarouselEdit(true)
              }}>
              編輯輪播圖
            </div>
            <div
              className="g-blue-btn"
              onClick={() => {
                setShowUploadBoardUI(true)
                setTimeout(() => {
                  setUploadBoardUIHeight(800)
                  setVisibility('visible')
                }, 1)
              }}>
              上傳公告
            </div>
          </div>
        )}
      </div>
      <Board
        moveToBoardRef={moveToBoardRef}
        editHasChange={editHasChange}></Board>
      <div className="footer-area">
        <Footer></Footer>
      </div>
    </div>
  )
}
