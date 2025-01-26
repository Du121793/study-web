import Head from 'next/head'
import Image from 'next/image'
import banner from '../public/imgs/banner.jpg'
import Link from 'next/link'
export default function Header(isLogined) {
  const loginURL = 'http://localhost:8080/auth/line'
  isLogined = false
  return (
    <div>
      <Head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </Head>
      <div className="header">
        <div className="banner">
          <div className="black"></div>
          <Image
            className="img"
            src={banner}
            alt=""
            width={2400}
            height={400}
          />
        </div>
        <div className="logo">
          <span>LOGO</span>
        </div>
        <div className="header-right">
          {!isLogined && (
            <Link
              className="login"
              href={loginURL}>
              登入
            </Link>
          )}
          {isLogined && <div className="myClass">我的課程</div>}
          {isLogined && (
            <div className="member-img">
              <span>頭貼</span>
              <img
                src=""
                alt=""
              />
            </div>
          )}
          {isLogined && <div className="log-out">登出</div>}
        </div>
      </div>
    </div>
  )
}
