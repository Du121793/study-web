import Image from 'next/image'
import Link from 'next/link'
import titleIcon from '../../../public/index/board/boardTitle.svg'
import { useEffect, useRef, useState, useImperativeHandle } from 'react'
import userService from '../../../method/userService'

const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP

import style from './board.module.css'

export default function Board({ editHasChange, moveToBoardRef }) {
  const [boards, setBoards] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPage, setTotalPage] = useState(0)
  const boardEle = useRef(null)

  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  useImperativeHandle(moveToBoardRef, () => ({
    doSomething: () => {
      moveToBoardEle()
    },
  }))

  const moveToBoardEle = () => {
    if (boardEle) {
      boardEle.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    setLoading(true)
    const data = {
      page: page,
      pageSize: pageSize,
    }
    userService
      .getBoards(data)
      .then((res) => {
        if (res?.success) {
          setLoading(false)
          setBoards(res.data.boards)
          setTotalPage(res)
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }, [editHasChange, pageSize])

  return (
    <div className={style['board-main']}>
      <div
        className={style['right-bottom-loading-area']}
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className={style['loading']}></div>
      </div>
      <div
        className={style['board-contianer']}
        ref={boardEle}>
        <div className={style['title']}>
          <span
            onClick={() => {
              moveToBoardEle()
            }}>
            最新消息
          </span>
          <Image
            className={style['icon']}
            src={titleIcon}
            alt="new info,s icon"
            width={40}
            height={40}></Image>
        </div>

        <ul className={style['news-link-area']}>
          {!boards.length && (
            <div
              className={style['loading-area']}
              style={{ width: '100%', height: '80px' }}></div>
          )}
          {boards &&
            boards.length > 0 &&
            boards.map((item, index) => {
              let data = {
                board_id: item._id,
              }
              return (
                <Link
                  className={style['news-container']}
                  key={index}
                  href={{ pathname: `${clientIp}/boardPage/BoardPage`, query: data }}>
                  <div className={style['categories']}>
                    <div className={style['content']}>
                      <div className={style['background']}></div>
                      <div className={style['text']}>{item.subTitle}</div>
                    </div>
                  </div>
                  <div className={style['info']}>{item.title}</div>
                </Link>
              )
            })}
        </ul>
        {boards && (
          <div
            className={style['more-news-link']}
            onClick={() => {
              setPageSize(pageSize + 10)
            }}>
            <span
              onClick={() => {
                setPageSize(pageSize + 10)
              }}>
              查看更多最新消息 {'>>>'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
