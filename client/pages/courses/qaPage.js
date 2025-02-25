import React from "react";
// 組件庫
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// global組件
import Header from "../../components/global/Header";

// method
import { useUserToken } from "../methods/service/useUserToken";
import userService from "../methods/service/userService";

// public
import noImageIcon from "../../public/course/no-image-available-icon.jpg";

// course component
import QaMessageBoard from "./messageBoard";

const QaPage = () => {
  // 從url獲取參數
  const router = useRouter();
  const { course_id } = router.query;
  // 大部分api需要的token
  const token = useUserToken();
  // 登陸狀態
  const [isLogined, setLogined] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // 是否有圖片狀態
  // 之後要有多張照片狀況
  const [image, serImage] = useState(false);

  // 請求使用者資料與設定登陸狀態
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data);
          setLogined(true);
        })
        .catch((err) => console.error("Error:", err.message));
    }
  }, [token]);

  const test = () => {
    // 先用測試的id:67bb6569c646a56b343ed51c
    userService.getQaInfo(token, "67bd66c2032865bc616bf2cc").then((res) => {
      console.log(res);
    });
  };

  return (
    <div className="qaPage-main">
      <Header loginState={isLogined} />
      <div className="qaPage-container">
        <div className="left-area">
          <div className="top">
            <button className="back-btn" onClick={test}>
              返回課程
            </button>
            <div className="course-name-title">課程名稱</div>
          </div>
          <div className="middle">
            <div className="image-area">
              {!image && (
                <img
                  className="no-image-icon"
                  src={noImageIcon}
                  alt="course has no image icon"
                />
              )}
            </div>
          </div>
          <div className="bottom">
            <div className="qa-info-area"></div>
          </div>
        </div>
        <div className="right-area">
          <div className="title">
            <div className="message-board-title">留言板</div>
          </div>
          <div className="message-board-area"></div>
        </div>
      </div>
      <QaMessageBoard />
    </div>
  );
};

export default QaPage;
