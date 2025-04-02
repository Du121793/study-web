// 組件庫
import { useState, useEffect } from 'react'
// 子組件
import Header from '../components/global/Header'
import Board from '../components/index/Board'
import Banner from '../components/index/Banner'
import Head from '../components/global/Globla'
import Footer from '../components/global/Footer'
// method
import { useUserToken } from '../method/useUserToken'
import userService from '../method/userService'
// component
import UploadCarousel from './profiles/UploadCarousel'
export default function Index() {
  const token = useUserToken()
  const [isLogined, setLogined] = useState(false)
  const [userShot, setUserShot] = useState(null)
  const [showCarouselEdit, setShowCarouselEdit] = useState(false)
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          if (!res.data.userinfo) {
            return
          }
          if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_lineID') || !sessionStorage.getItem('user_line_shot') || sessionStorage.getItem('user_id')) {
            sessionStorage.setItem('user_lineID', res.data.lineID)
            sessionStorage.setItem('user_id', res.data._id)
            sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
            setUserShot(res.data.userinfo.pictureUrl)
            sessionStorage.setItem('user_role', res.data.role)
          } else {
          }
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  const test = () => {}
  return (
    <div className="index-main">
      {showCarouselEdit && (
        <UploadCarousel
          showCarouselEdit={showCarouselEdit}
          setShowCarouselEdit={setShowCarouselEdit}
        />
      )}
      <Head></Head>
      <div
        className="RWD"
        onClick={test}>
        <Header
          loginState={isLogined}
          user_line_shot={userShot}></Header>
        <Banner
          showCarouselEdit={showCarouselEdit}
          setShowCarouselEdit={setShowCarouselEdit}></Banner>
      </div>
      <Board></Board>
      <Footer></Footer>
    </div>
  )
}
