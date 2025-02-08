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

}
