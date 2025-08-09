// 原生組件庫
import { useEffect, useRef, useState, useImperativeHandle } from 'react'
import userService from '../../../method/userService'
import Image from 'next/image'
import Link from 'next/link'
// public
import titleIcon from '../../../public/index/board/boardTitle.svg'
// component
import PageSwitcher from '../../../components/pageSwitcher/PageSwitcher'
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'

import style from './board.module.css'

export default function Board({ editHasChange, moveToBoardRef }) {
  const [boards, setBoards] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPage, setTotalPage] = useState(0)
  const [total, setTotal] = useState(0)
  const boardEle = useRef(null)

  // UX
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
  }

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
          setBoards(res.data.boards)
          setTotalPage(res.data.totalPages)
          setTotal(res.data.total)
        } else {
          setMessage('發生錯誤')
        }
      })
      .catch((err) => {
        setMessage('發生錯誤')
      })
      .finally(() => {
        initUX()
      })
  }, [editHasChange, page])

  return (
    <div className={style['board-main']}>
      <div
        className={style['board-contianer']}
        ref={boardEle}>
        {loading && <LoadingAnime top={'50%'} />}
        {message && (
          <MessageAnime
            message={message}
            top={'100px'}
            duration={2000}
          />
        )}
        <div className={style['title']}>
          <span
            onClick={() => {
              moveToBoardEle()
              console.log(boards)
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
          <PageSwitcher
            setPage={setPage}
            page={page}
            pageSize={pageSize}
            totalPage={totalPage}
            total={total}></PageSwitcher>
        )}
      </div>
    </div>
  )
}
