import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
export default function Response() {
  const router = useRouter()
  const homePageURL = 'http://localhost:3000'
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
      localStorage.setItem('JWT token', token)
      router.push(homePageURL)
    }
  }, [token])
  return <div></div>
}
