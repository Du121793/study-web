// 組件庫
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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
// public
import backgroundImage from '../public/backGroundIMG/stefanie-jockschat-9f1PRQs6Brs-unsplash.jpg'
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
          className="image"
          width={0}
          height={0}></Image>
      </div>
      <div className="header-area">
        <Header
          callBoardMoveToBoardFunction={callBoardMoveToBoardFunction}
          loginState={logined}
          user_line_shot={userShot}
          inIndex="public"></Header>
      </div>
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
        <Banner bannerHasChange={bannerHasChange}></Banner>
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
