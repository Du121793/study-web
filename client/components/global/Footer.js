// 組件庫
import React from 'react'
import Image from 'next/image'
// public
import facebook from '../../public/global/facebook.png'
import instagram from '../../public/global/instagram.png'
import line from '../../public/global/line.png'
export default function Footer() {
  return (
    <div className="footer-main">
      <div className="imgs">
        <Image
          src={facebook}
          alt="facebook"
          width={48}
          height={48}></Image>
        <Image
          src={instagram}
          alt="instagram"
          width={48}
          height={48}></Image>
        <Image
          src={line}
          alt="line"
          width={48}
          height={48}></Image>
      </div>

      <div className="footer-content">
        <p>© 2025 Your Company. All rights reserved.</p>
      </div>
    </div>
  )
}
