// 組件庫
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
// 子組件
import Header from '../components/global/Header'
import Footer from '../components/global/Footer'
// method
import { useUserToken } from '../method/useUserToken'
import userService from '../method/userService'
// component
import Board from './components/board/Board'
import Banner from './components/banner/Banner'
import UploadBoard from './components/uploadBoard/UploadBoard'
import UploadCarousel from './components/uploadCarousel/UploadCarousel'
// public
import backgroundImage from '../public/backGroundIMG/stefanie-jockschat-9f1PRQs6Brs-unsplash.jpg'
// css

export default function Index() {
  const token = useUserToken()
  const [logined, setLogined] = useState(false)
  const [userShot, setUserShot] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [showCarouselEdit, setShowCarouselEdit] = useState(false)
  const [showUploadBoardUI, setShowUploadBoardUI] = useState(false)
  const [uploadBoardUIHeight, setUploadBoardUIHeight] = useState(0)
  const [bannerHasChange, setBannerHasChange] = useState(false)
  const [boardhasChange, setBoardHasChange] = useState(false)
  const [editHasChange, setEditHasChange] = useState(false)
  // 讀取旋轉
  const [loading, setLoading] = useState(false)
  // 用於開關UI時覆蓋所有內部元素
  const [visibility, setVisibility] = useState('visible')
  // 移動到最新消息function
  const moveToBoardRef = useRef(null)

  const callBoardMoveToBoardFunction = () => {
    if (moveToBoardRef.current) moveToBoardRef.current.doSomething()
  }

  // session 設定
  useEffect(() => {
    /* 獲取userinfo存到sessionStorage */
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          if (!res?.data?.userinfo) {
            return
          }
          if (!localStorage.getItem('user_lineID') || localStorage.getItem('user_lineID') !== res.data.lineID) {
            localStorage.setItem('user_lineID', res.data.lineID)
          }
          if (!localStorage.getItem('user_id') || localStorage.getItem('user_id') !== res.data._id) {
            localStorage.setItem('user_id', res.data._id)
          }
          if (!localStorage.getItem('user_line_shot') || localStorage.getItem('user_line_shot') !== res.data.userinfo.pictureUrl) {
            localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
          }
          if (!localStorage.getItem('user_role') || localStorage.getItem('user_role') !== res.data.role) {
            localStorage.setItem('user_role', res.data.role)
          }
          if (!localStorage.getItem('user_name') || localStorage.getItem('user_name') !== res.data.userinfo.username) {
            localStorage.setItem('user_name', res.data.userinfo.username)
          }
          if (!localStorage.getItem('token')) {
            localStorage.setItem('token', token)
          }
          setUserShot(res.data.userinfo.pictureUrl)
          setUserRole(res.data.role)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  useEffect(() => {
    if (sessionStorage.getItem('homePageScrollToNews') === '1') {
      callBoardMoveToBoardFunction()
      sessionStorage.setItem('homePageScrollToNews', 0)
    }
  }, [])

  return (
    <div className="index-main">
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className="background-image">
        <Image
          src={backgroundImage}
          alt="back ground image"
          className="image"></Image>
      </div>
      <div className="header-area">
        <Header
          callBoardMoveToBoardFunction={callBoardMoveToBoardFunction}
          loginState={logined}
          user_line_shot={userShot}
          inIndex="public"></Header>
      </div>
      <div className="RWD">
        <div className="popup">
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
        </div>
        <div className="banner-area">
          <Banner bannerHasChange={bannerHasChange}></Banner>
        </div>
        {userRole && userRole === 'admin' && (
          <div className="btn-area">
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
