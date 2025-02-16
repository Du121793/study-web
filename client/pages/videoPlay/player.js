// 組件庫
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
// public
import arrow from "../../public/videoPlay/arrow.png";
import downArrow from "../../public/videoPlay/downArrow.png";
import logo from "../../public/imgs/logo.jpg";
// method
import { useUserToken } from "../methods/service/useUserToken";
import userService from "../methods/service/userService";

export default function player() {
  const baseUrl = "http://localhost:3000/";
  const token = useUserToken();
  // 路由初始化
  const router = useRouter();
  const { course_name, video_id, course_id, info } = router.query;
  // 控制右側列表開關
  const [videoListIsOpen, setVideoListIsOpen] = useState(true);
  const [playerHeight, setPlayerHeight] = useState(600);
  const [videoListWidth, setVideoListWidth] = useState(300);
  const [videoListMarginRight, setVideoListMarginRight] = useState("#fff");
  // 播放器需要的影片url
  const [videoUrl, setVideoUrl] = useState();
  // 影片清單
  const [VideosList, setVideosList] = useState([]);

  useEffect(() => {
    if (token && course_id && video_id) {
      getVideoUrlFc();
      getVideoInfoFc();
    }
  }, [token, course_id, video_id]);

  function getVideoUrlFc() {
    if (token && course_id && video_id) {
      userService.getVideoLink(token, course_id, video_id).then((res) => {
        setVideoUrl(res);
      });
    }
  }
  function getVideoInfoFc() {
    if (token && course_id) {
      userService
        .getVideoInfo(token, course_id, {
          type: "MainClass",
          page: 1,
          sortBy: "recordDate",
          sortOrder: "asc",
        })
        .then((res) => {
          setVideosList(res);
        });
    }
  }

  //   切換右邊列表狀態同時更改播放器大小
  const listSwitch = (e) => {
    VideosList.map((item) => {
      console.log(item._id);
    });
    console.log(info);
    console.log("video_id:" + video_id);
    if (e === "close-button") {
      setVideoListIsOpen(false);
      setVideoListWidth(0);
      setVideoListMarginRight("-300px");
      setPlayerHeight(700);
    } else if (e === "open-button") {
      setVideoListIsOpen(true);
      setVideoListWidth(300);
      setVideoListMarginRight("0");
      setPlayerHeight(600);
    }
  };

  // 打開列表功能
  const openEpisodeBtn = (e) => {
    console.log(course_name)
    console.log(e.target.parentNode)
    let episodes = e.target.parentNode.querySelector('.episodes')
    if (episodes.style.maxHeight != '9999px') {
      episodes.style.maxHeight = '9999px'
    } else {
      episodes.style.maxHeight = '0'
    }
  };
  return (
    <div className="video-player-main">
      <div className="header">
        <div className="logo">
          <Image
            src={logo}
            alt="123"
            className="logos"
            width={100}
            height={100}
          ></Image>
        </div>

        <Link
          className="user-shot"
          href={`${baseUrl}courses/course?courseName=${course_name}&courseId=${course_id}`}>
          回到課程
        </Link>
      </div>
      <div className="player-area">
        {/* 左側影片播放器 */}
        <div className="player">
          <iframe
            style={{ height: `${playerHeight}px` }}
            id="iframe"
            src={videoUrl}
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* 影片資訊 */}
          <div className="video-info">
            {info && <div className="title">{info.split(",")[1]}</div>}
            {info && (
              <div className="introduce">
                <div className="time">
                  <div>{info && info.split(",")[2].split(/[-T:.]/)[0]}年</div>
                  <div>{info && info.split(",")[2].split(/[-T:.]/)[1]}月</div>
                  <div>{info && info.split(",")[2].split(/[-T:.]/)[2]}日</div>
                  {info &&
                    info.split(",")[2].split(/[-T:.]/)[3] >= 0 &&
                    info.split(",")[2].split(/[-T:.]/)[3] <= 11 && (
                      <div>上午{info.split(",")[2].split(/[-T:.]/)[3]}點</div>
                    )}
                  {info &&
                    info.split(",")[2].split(/[-T:.]/)[3] >= 13 &&
                    info.split(",")[2].split(/[-T:.]/)[3] <= 23 && (
                      <div>
                        下午{info.split(",")[2].split(/[-T:.]/)[3] - 12}點
                      </div>
                    )}
                  {info && <div>{info.split(",")[2].split(/[-T:.]/)[4]}分</div>}
                </div>
                {info.split(",")[0]}
              </div>
            )}
          </div>
        </div>

        {/* 切換右側列表的按鈕 */}
        {!videoListIsOpen && (
          <button
            id="open-button"
            className="open-button"
            onClick={(e) => {
              listSwitch(e.target.id);
            }}
          >
            <Image
              className="arrow"
              src={arrow}
              alt="switch video list's arrow button"
            ></Image>
            打開列表
          </button>
        )}

        {/* 右側影片集數列表 */}
        <div
          className="video-info-list"
          style={{
            width: `${videoListWidth}px`,
            marginRight: `${videoListMarginRight}`,
          }}
        >
          {/* 開關按鈕 */}
          <div className="title">
            影片列表
            <div
              id="close-button"
              className="hidden-info-btn"
              onClick={(e) => {
                listSwitch(e.target.id);
              }}
            >
              x
            </div>
          </div>
          <ul className="selections">
            {VideosList &&
              VideosList.map(
                /* 第二代 */
                (item, index) =>
                  // 判斷是否為目前影片
                  item._id === video_id ? (
                    // 有active
                    <li
                      key={index}
                      className="option-lv1">
                      <div
                        className="active option-header"
                        onClick={(e) => {
                          openEpisodeBtn(e)
                        }}>
                        <div className="video-list-title">{item.title}</div>
                        <Image
                          src={downArrow}
                          className="open-list-arrow"
                          alt="open video's list of arrow button"
                          width={32}
                          height={32}
                        ></Image>
                      </div>
                      <ul className="episodes">
                        <li className="option-lv2 episodes-list">
                          <Link
                            className="Link"
                            href={`${baseUrl}videoPlay/player?course_name=${course_name}&video_id=${item._id}&course_id=${course_id}&info=${[item.description, item.title, item.date]}`}>
                            第1集
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : (
                    // 非active
                    <li
                      key={index}
                      className="option-lv1">
                      <div
                        className="option-header"
                        onClick={(e) => {
                          openEpisodeBtn(e)
                        }}>
                        <div className="video-list-title">{item.title}</div>
                        <Image
                          src={downArrow}
                          className="open-list-arrow"
                          alt="open video's list of arrow button"
                          width={32}
                          height={32}
                        ></Image>
                      </div>
                      <ul className="episodes">
                        <li className="option-lv2 episodes-list">
                          <Link
                            className="Link"
                            href={`${baseUrl}videoPlay/player?course_name=${course_name}&video_id=${item._id}&course_id=${course_id}&info=${[item.description, item.title, item.date]}`}>
                            第1集
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )
              )}
          </ul>
        </div>
      </div>
    </div>
  );
}
