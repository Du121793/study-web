// 組件庫
import Image from 'next/image'
import Link from 'next/link'
// public
import facebook from '../../public/SocialSoftware/facebook.png'
import line from '../../public/SocialSoftware/line.png'
import googleMap from '../../public/SocialSoftware/googleMap.png'
// style
import style from './style.module.css' // Import the CSS module

export default function Footer() {
  const faceBookUrl = 'https://www.facebook.com/share/16DFgT3Sfb/'
  const lineUrl = 'https://line.me/R/ti/p/@910fvcei'
  const address = 'https://maps.app.goo.gl/KzkExpAGoPxBggUL6'
  const email = 'wy7962999@gmail.com'
  const phone = '06-7962999'
  return (
    <div className={style['footer-main']}>
      <div className={style['info-area']}>
        <div className={style.images}>
          <Link href={faceBookUrl}>
            <Image
              className={style.icon}
              src={facebook}
              alt="facebook icon"
              width={36}
              height={36}></Image>
          </Link>
          <Link href={lineUrl}>
            <Image
              className={style.icon}
              src={line}
              alt="line icon"
              width={36}
              height={36}></Image>
          </Link>
          <Link href={address}>
            <Image
              className={style.icon}
              src={googleMap}
              alt="google map icon"
              width={36}
              height={36}></Image>
          </Link>
        </div>

        <div className={style.info}>
          <div className={style.content}>聯絡信箱 : {email} /</div>
          <div className={style.content}>電話號碼 : {phone} /</div>
          <div className={style.content}>
            地址 :
            <Link
              className={style.link}
              href={address}>
              723台南市西港區慶安路212號
            </Link>
          </div>
        </div>
      </div>

      <div className={style['footer-content']}>
        <p>聚焦於目標四大四中的學生</p>
        <p>© 2025 最專業的高中物理-- 王佑物理。</p>
      </div>
    </div>
  )
}
