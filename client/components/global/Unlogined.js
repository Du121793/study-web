import Image from 'next/image'
import Link from 'next/link'
import lineIcon from '../../public/imgs/line.png'
export default function Unlogined() {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
  
  // 路由參數
  const loginURL = `${serverIp}/auth/line`
  return (
    <div className="unlogined-main">
      <div className="content">請先進行登錄</div>
      <Link
        target="_blank"
        className="login-area"
        href={loginURL}>
        <span className="login-content">LINE登陸</span>
        <div className="line-login-icon-area">
          <Image
            className="icon"
            alt="line-login-button"
            src={lineIcon}
            width={1200}></Image>
        </div>
      </Link>
    </div>
  )
}
