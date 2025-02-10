import banner from '../../public/index/banner/banner.png'
import Image from 'next/image'
export default function Home(isLogined) {
  isLogined = false
  return (
    <div className="banner-main">
      <div className="banner">
        <Image
          className="img"
          src={banner}
          alt="banner,s image"
          width={400}
        />
      </div>
    </div>
  )
}
