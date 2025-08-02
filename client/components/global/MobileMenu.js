// import { useState, useEffect } from 'react'
// import { FaBars, FaTimes } from 'react-icons/fa'

// export default function MobileMenu({ userRole, onEditCarousel, onUploadBoard }) {
//   const [isOpen, setIsOpen] = useState(false)

//   // 當菜單打開時禁止背景滾動
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden'
//     } else {
//       document.body.style.overflow = 'unset'
//     }
//     return () => {
//       document.body.style.overflow = 'unset'
//     }
//   }, [isOpen])

//   return (
//     <div className={`mobile-menu ${isOpen ? 'menu-open' : ''}`}>
//       <button 
//         className="menu-toggle" 
//         onClick={() => setIsOpen(!isOpen)}
//         aria-label={isOpen ? '關閉選單' : '開啟選單'}>
//         {isOpen ? <FaTimes /> : <FaBars />}
//       </button>
      
//       <div className={`menu-content ${isOpen ? 'open' : ''}`}>
//         <div className="menu-items">
//           {userRole === 'admin' && (
//             <>
//               <button
//                 className="menu-item"
//                 onClick={() => {
//                   onEditCarousel()
//                   setIsOpen(false)
//                 }}>
//                 編輯輪播圖
//               </button>
//               <button
//                 className="menu-item"
//                 onClick={() => {
//                   onUploadBoard()
//                   setIsOpen(false)
//                 }}>
//                 上傳公告
//               </button>
//             </>
//           )}
//           <button className="menu-item">關於我們</button>
//           <button className="menu-item">聯絡資訊</button>
//         </div>
//       </div>
      
//       {/* 點擊遮罩層關閉菜單 */}
//       {isOpen && (
//         <div 
//           className="menu-overlay"
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </div>
//   )
// } 