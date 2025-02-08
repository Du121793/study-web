// useUserToken.js
"use client"; // 在 Next.js 13 的 app router 時，保證這是一個客戶端環境
import { useEffect, useState } from "react";

export function useUserToken() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // 只在瀏覽器端取 localStorage
    if (typeof window !== "undefined") {
      const foundToken = localStorage.getItem("token")
        ? localStorage.getItem("token")
        : null;
      setToken(foundToken);
    }
  }, []);

  return token;
}
