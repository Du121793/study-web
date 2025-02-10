import Image from 'next/image'
import Link from 'next/link'
import titleIcon from '../../public/index/board/boardTitle.svg'
export default function Board() {
  return (
    <div className="board-main">
      <div className="board-contianer">
        <div className="title">
          <span>最新消息</span>
          <Image
            className="icon"
            src={titleIcon}
            alt='new info,s icon'
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
          <li className="news-container">
            <div className="categories">
              <div className="background"></div>
              <div className="content">高中三年專班</div>
            </div>
            <div className="info">113年暑期衝刺專班已開放報名!</div>
          </li>
          <li className="news-container">
            <div className="categories">
              <div className="background"></div>
              <div className="content">高中三年專班</div>
            </div>
            <div className="info">113年暑期衝刺專班已開放報名!</div>
          </li>
          <li className="news-container">
            <div className="categories">
              <div className="background"></div>
              <div className="content">高中三年專班</div>
            </div>
            <div className="info">113年暑期衝刺專班已開放報名!</div>
          </li>
        </ul>
        <div className="more-news-link">
          <span>查看更多最新消息 {'>>>'}</span>
        </div>
      </div>
    </div>
  )
}
