import Image from 'next/image'
import Link from 'next/link'
import titleIcon from '../../public/index/board/boardTitle.svg'
import { useEffect, useRef, useState } from 'react'
import userService from '../../method/userService'
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP

export default function Board({ boardhasChange }) {
  const [boards, setBoards] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPage, setTotalPage] = useState(0)
  const boardEle = useRef(null)

  const moveToBoardEle = () => {
    if (boardEle) {
      boardEle.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const test = () => {
    console.log(totalPage)
  }

  useEffect(() => {
    const data = {
      page: page,
      pageSize: pageSize,
    }
    userService.getBoards(data).then((res) => {
      if (res.success) {
        setBoards(res.data.boards)
        setTotalPage(res)
      } else {
        console.log(res)
      }
    })
  }, [boardhasChange, pageSize])

  return (
    <div className="board-main">
      <div
        className="board-contianer"
        ref={boardEle}>
        <div className="title">
          <span onClick={moveToBoardEle}>最新消息</span>
          <Image
            className="icon"
            src={titleIcon}
            alt="new info,s icon"
            width={40}
            height={40}></Image>
        </div>

        <ul className="news-link-area">
          {boards &&
            boards.length > 0 &&
            boards.map((item, index) => {
              let data = {
                board_id: item._id,
              }
              return (
                <Link
                  className="news-container"
                  key={index}
                  href={{ pathname: `${clientIp}/index/BoardPage`, query: data }}>
                  <div className="categories">
                    <div className="background"></div>
                    <div className="content">{item.title}</div>
                  </div>
                  <div className="info">{item.subTitle}</div>
                </Link>
              )
            })}
        </ul>
        <div
          className="more-news-link"
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
      </div>
    </div>
  )
}
