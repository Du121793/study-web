import Image from 'next/image'
import Link from 'next/link'
import titleIcon from '../../public/index/board/boardTitle.svg'
import { useUserToken } from '../../method/useUserToken'
import { useEffect, useState } from 'react'
import userService from '../../method/userService'
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function Board({ boardhasChange }) {
  const token = useUserToken()
  const [boards, setBoards] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPage, setTotalPage] = useState(0)
  const test = () => {
    console.log(totalPage)
  }
  useEffect(() => {
    const data = {
      page: page,
      pageSize: pageSize,
    }
    if (token) {
      userService.getBoards(token, data).then((res) => {
        if (res.success) {
          setBoards(res.data.boards)
          setTotalPage(res)
        }
      })
    }
  }, [token, boardhasChange, pageSize])

  return (
    <div className="board-main">
      <div className="board-contianer">
        <div className="title">
          <span onClick={test}>最新消息</span>
          <Image
            className="icon"
            src={titleIcon}
            alt="new info,s icon"
            width={40}
            height={40}></Image>
        </div>
        <ul className="news-types-area">
          <li>
            <div className="news-type active">班級公告</div>
          </li>
          <li>
            <div className="news-type">教育新聞</div>
          </li>
        </ul>

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
            setPageSize(pageSize + 5)
          }}>
          <span
            onClick={() => {
              setPageSize(pageSize + 5)
            }}>
            查看更多最新消息 {'>>>'}
          </span>
        </div>
      </div>
    </div>
  )
}
