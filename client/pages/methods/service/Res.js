import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Response() {
  const router = useRouter()
  // 從環境變數取得 clientIp
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const homePageURL = clientIp
  const [token, setToken] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      setToken(token)
    }
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', `JWT ${token}`)
      // 設定完 localStorage 後跳轉到 clientIp
      router.push(homePageURL)
    }
  }, [token, router, homePageURL])

  return <div></div>
}
