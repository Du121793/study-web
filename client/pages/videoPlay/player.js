import { useState } from 'react'
import Image from 'next/image'
import arrow from '../../public/videoPlay/arrow.png'
export default function MyCourse() {
  // 控制右側列表開關
  const [videoListIsOpen, setVideoListIsOpen] = useState(true)
  const [playerHeight, setPlayerHeight] = useState(600)
  const [videoListWidth, setVideoListWidth] = useState(300)
  const [videoListMarginRight, setVideoListMarginRight] = useState('#fff')

  //   切換右邊列表狀態同時更改播放器大小
  const listSwitch = (e) => {
    if (e === 'close-button') {
      setVideoListIsOpen(false)
      setVideoListWidth(0)
      setVideoListMarginRight('-300px')
      setPlayerHeight(700)
    } else if (e === 'open-button') {
      setVideoListIsOpen(true)
      setVideoListWidth(300)
      setVideoListMarginRight('0')
      setPlayerHeight(600)
    }
  }
  return (
    <div className="video-player-main">
      <div className="header">這裡是Header</div>

      <div className="player-area">
        {/* 左側影片播放器 */}
        <div className="player">
          <iframe
            style={{ height: `${playerHeight}px` }}
            id="iframe"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* 影片資訊 */}
          <div className="video-info">
            <div className="title">標題</div>
            <div className="introduce">影片介紹</div>
          </div>
        </div>

        {/* 切換右側列表的按鈕 */}
        {!videoListIsOpen && (
          <button
            id="open-button"
            className="open-button"
            onClick={(e) => {
              listSwitch(e.target.id)
            }}>
            <Image
              className="arrow"
              src={arrow}
              alt="switch video list's arrow button"></Image>
            打開列表
          </button>
        )}

        {/* 右側影片集數列表 */}
        <div
          className="video-info-list"
          style={{ width: `${videoListWidth}px`, marginRight: `${videoListMarginRight}` }}>
          <div className="title">
            影片標題
            <div
              id="close-button"
              className="hidden-info-btn"
              onClick={(e) => {
                listSwitch(e.target.id)
              }}>
              x
            </div>
          </div>
          <ul>
            <li>第 1 集</li>
            <li>第 2 集</li>
            <li>第 3 集</li>
            <li>第 4 集</li>
            <li>第 5 集</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
