// 組件庫
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
// 子組件
// import Header from '../components/global/Header'
import Header from '../components/header/Header'
import Footer from '../components/footer/Footer'
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
// style
import style from './index.module.css'

export async function getStaticProps() {
  try {
    // banner
    const carouselRes = await userService.getCarousels()
    const initialCarousel = carouselRes.success ? carouselRes.data : []

    return {
      props: { initialCarousel },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Carousel fetch error:', error)
    return {
      props: { initialCarousel: [] },
      revalidate: 60,
    }
  }
}

export default function Index({ initialCarousel, initialHeader }) {
  const token = useUserToken()
  const [logined, setLogined] = useState(false)
  const [userShot, setUserShot] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [showUploadBoardUI, setShowUploadBoardUI] = useState(false)
  const [uploadBoardUIHeight, setUploadBoardUIHeight] = useState(0)
  const [bannerHasChange, setBannerHasChange] = useState(false)
  const [editHasChange, setEditHasChange] = useState(false)
  // 調整header的index用
  const [hasPop, setHasPop] = useState(false)
  // 讀取旋轉
  const [loading, setLoading] = useState(false)
  // 移動到最新消息function
  const moveToBoardRef = useRef(null)

  // 控制滑條
  const mainRef = useRef()

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
    <div
      ref={mainRef}
      className={style['index-main']}>
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className={style['background-image']}>
        <Image
          src={backgroundImage}
          alt="back ground image"
          className={style['image']}></Image>
      </div>
      <div
        style={{ zIndex: hasPop ? 3 : 4 }}
        className={style['header-area']}>
        <Header
          initialHeader={initialHeader}
          callBoardMoveToBoardFunction={callBoardMoveToBoardFunction}
          loginState={logined}
          user_line_shot={userShot}
          inIndex="public"></Header>
      </div>
      <div
        className={style['banner-area']}
        onClick={() => {}}>
        <Banner
          bannerHasChange={bannerHasChange}
          initialCarousel={initialCarousel}></Banner>
      </div>
      <div className={style['pops']}>
        {userRole && userRole === 'admin' && (
          <UploadCarousel
            bannerHasChange={bannerHasChange}
            setBannerHasChange={setBannerHasChange}
            setHasPop={setHasPop}
          />
        )}
        {userRole && userRole === 'admin' && (
          <UploadBoard
            editHasChange={editHasChange}
            setEditHasChange={setEditHasChange}
            setShowUploadBoardUI={setShowUploadBoardUI}
            setUploadBoardUIHeight={setUploadBoardUIHeight}
            uploadBoardUIHeight={uploadBoardUIHeight}
            setHasPop={setHasPop}
            mode={'upload'}
          />
        )}
      </div>
      <Board
        moveToBoardRef={moveToBoardRef}
        editHasChange={editHasChange}></Board>
      <div className={style['footer-area']}>
        <Footer></Footer>
      </div>
    </div>
  )
}
