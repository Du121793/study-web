// 原生組件
import Image from 'next/image'
// style
import style from './style.module.css'
// public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'
export default function PageSwitcher({ total = 0, page, setPage, pageSize, totalPage }) {
  if (total === 0) return
  function getPage(total, thisPage, pageSize) {
    /*
    total = 總頁數
    thisPage = 目前頁數
    pageSize = 一頁幾個資料
    */
    // 無資料回傳
    if (total <= 0 || thisPage <= 0 || thisPage > total) {
      return []
    }

    let pages = []
    if (total <= pageSize) {
      for (let i = 0; i < total; i++) {
        pages.push(i + 1)
      }
      return pages
    }

    const leftSize = Math.floor((pageSize - 1) / 2)
    const rightSize = pageSize - 1 - leftSize

    let start = Math.max(1, thisPage - leftSize)
    let end = Math.min(total, thisPage + rightSize)

    if (start === 1) {
      end = Math.min(total, pageSize)
      start = 1
    } else if (end === total) {
      start = Math.max(1, total - pageSize + 1)
      end = total
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }
  const test = () => {}
  return (
    <div className={style['page-switch']}>
      {/* 回到第一頁 */}
      <Image
        alt="switch back to first page icon"
        src={dbArrowLeft}
        className={style['page-switcher']}
        width={24}
        height={24}
        onClick={() => {
          setPage(1)
          test()
        }}></Image>
      {/* 回到上一頁 */}
      <Image
        alt="switch back one page icon"
        src={ArrowLeft}
        className={style['page-switcher']}
        width={24}
        height={24}
        onClick={() => {
          if (page === 1) {
            return
          } else {
            setPage((prop) => prop - 1)
          }
        }}></Image>
      {/* 根據函式拿到頁數 */}
      {getPage(totalPage, page, pageSize).map((item, index) => {
        if (page === item) {
          return (
            <div
              key={index}
              className={`${style['now-page']} ${style['active']}`}>
              {item}
            </div>
          )
        }
        return (
          <div
            onClick={() => {
              setPage(item)
            }}
            key={index}
            className={style['now-page']}>
            {item}
          </div>
        )
      })}
      {/* 前往下一頁 */}
      <Image
        alt="switch next to left page icon"
        src={ArrowRight}
        className={style['page-switcher']}
        width={24}
        height={24}
        onClick={() => {
          if (page === totalPage) {
            return
          } else {
            setPage((prop) => prop + 1)
          }
        }}></Image>
      {/* 前往末頁 */}
      <Image
        alt="switch next one page icon"
        src={dbArrowRight}
        className={style['page-switcher']}
        width={24}
        height={24}
        onClick={() => {
          setPage(totalPage)
        }}></Image>
    </div>
  )
}
