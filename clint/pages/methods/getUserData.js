// SomeReactPageOrComponent.jsx
import { useEffect, useState } from "react";
import { useUserToken } from "./service/useUserToken";
import userService from "./service/userService";

export default function SomeReactPageOrComponent() {
  const token = useUserToken();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => setUserInfo(data))
        .catch((err) => console.error("Error:", err));
    }
  }, [token]);

  // if (!token) return <div>還沒有 token，或正在取得中…</div>;
  // if (!userInfo) return <div>正在載入使用者資料…</div>;

  // return (
  //   <div>
  //     <p>用戶姓名：{userInfo.userinfo.username}</p>
  //     <p>用戶ID:{userInfo._id}</p>
  //     <p>
  //       用戶註冊課程:
  //       {userInfo.courses.map((n) => n + " ")}
  //     </p>
  //     <img
  //       src={userInfo.userinfo.pictureUrl}
  //       alt=""
  //       onClick={(e) => {
  //         e.target.style.width = "300px";
  //       }}
  //     />
  //     <div>all data: {JSON.stringify(userInfo)}</div>
  //   </div>
  // );
}
