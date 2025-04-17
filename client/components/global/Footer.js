// 組件庫
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
// public
import facebook from '../../public/global/facebook.png'
import instagram from '../../public/global/instagram.png'
import line from '../../public/global/line.png'
import googleMap from '../../public/global/google-maps.png'
export default function Footer() {
  const faceBookUrl = 'https://www.facebook.com/share/16DFgT3Sfb/'
  const lineUrl = 'https://line.me/R/ti/p/@910fvcei'
  const address = 'https://maps.app.goo.gl/KzkExpAGoPxBggUL6'
  const email = 'wy7962999@gmail.com'
  const phone = '06-7962999'
  return (
    <div className="footer-main">
      <div className="info-area">
        <div className="images">
          <Link href={faceBookUrl}>
            <Image
              src={facebook}
              alt="facebook icon"
              width={48}
              height={48}></Image>
          </Link>
          <Link href={lineUrl}>
            <Image
              src={line}
              alt="line icon"
              width={48}
              height={48}></Image>
          </Link>
          <Link href={address}>
            <Image
              src={googleMap}
              alt="google map icon"
              width={48}
              height={48}></Image>
          </Link>
        </div>

        <div className="info">
          <div className="content">聯絡信箱 : {email} /</div>
          <div className="content">電話號碼 : {phone} /</div>
          <div className="content">
            地址 :
            <Link
              className="link"
              href={address}>
              723台南市西港區慶安路212號
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-content">
        <p>聚焦於目標四大四中的學生</p>
        <p>© 2025 最專業的高中物理-- 王佑物理。</p>
      </div>
    </div>
  )
}
