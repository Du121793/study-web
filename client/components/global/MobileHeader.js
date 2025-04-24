import Image from 'next/image'
import { FaBars } from 'react-icons/fa'

export default function MobileHeader({ onMenuClick, userShot }) {
  return (
    <div className="mobile-header">
      <div className="header-content">
        <div className="logo-area">
          <Image
            src="/logo.png"
            alt="物理"
            width={120}
            height={40}
            objectFit="contain"
          />
        </div>
        
        <div className="right-area">
          {userShot && (
            <div className="user-avatar">
              <Image
                src={userShot}
                alt="用戶頭像"
                width={32}
                height={32}
                objectFit="cover"
              />
            </div>
          )}
          <button 
            className="menu-button"
            onClick={onMenuClick}
            aria-label="開啟選單">
            <FaBars />
          </button>
        </div>
      </div>
    </div>
  )
} 