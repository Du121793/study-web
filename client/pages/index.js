import Header from "../components/global/Header";
import Board from "../components/index/Board";
import Boder from "../components/index/Banner";
import Head from "../components/global/Globla";
import { useUserToken } from "../method/useUserToken";
import userService from "../method/userService";
import { useState, useEffect } from "react";
export default function Index() {
  const token = useUserToken();
  const [userInfo, setUserInfo] = useState(null);
  const [isLogined, setLogined] = useState(false);
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => {
          setUserInfo(data);
          setLogined(true);
        })
        .catch((err) => console.error("Error:", err));
    }
  }, [token]);
  return (
    <div className="index-main">
      <Head></Head>
      <div className="RWD">
        <Header loginState={isLogined}></Header>
        <Boder></Boder>
      </div>
      <Board></Board>
    </div>
  );
}
