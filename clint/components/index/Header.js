import Head from 'next/head'
import Image from 'next/image'
import lineIcon from '../../public/imgs/line.png'
import Link from 'next/link'
import shot from '../../public/imgs/shot.jpg'
import logo from '../../public/imgs/logo.jpg'
export default function Header(isLogined) {
  const loginURL = 'http://localhost:8080/auth/line'
  const HomePageURL = 'http://localhost:3000'
  const ProfilePageURL = 'http://localhost:3000/profile'
  isLogined = true
  return (
    <div>
      <Head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </Head>
      <div className="header-main">
        {/* header's logo */}
        <Link
          className="logo-container"
          href={HomePageURL}>
          <Image
            className="logo-img"
            alt="logo,s image"
            src={logo}
            width={1400}></Image>
        </Link>
        <div className="header-right">
          {/* line login's Link */}
          {!isLogined && (
            <Link
              className="login"
              href={loginURL}>
              <span>LINE登陸</span>
              <div className="img">
                <Image
                  className="icon"
                  alt="line-login-button"
                  src={lineIcon}
                  width={1200}></Image>
              </div>
            </Link>
          )}
          {/* myClass Link */}
          {isLogined && <div className="myClass">課程</div>}
          {/* user shot */}
          {isLogined && (
            <Link href={ProfilePageURL}>
              <div className="member-img">
                <Image
                  className="shot"
                  src={shot}
                  alt="user's shot"
                  width={400}></Image>
                <img />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
