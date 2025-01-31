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
export async function getData(token) {
  if (token) {
    try {
      const URL = 'http://localhost:8080/'
      const auth = URL + 'user'
      const res = await fetch(auth, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'JWT ' + token,
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP error ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('getData Error:', error)
    }
  }
}
