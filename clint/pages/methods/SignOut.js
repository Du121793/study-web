export function useUserToken() {
  useEffect(() => {
    // 只在瀏覽器端取 localStorage
    if (typeof window !== 'undefined') {
      const foundToken = localStorage.getItem('token') ? localStorage.getItem('token') : null
      setToken(foundToken)
    }
  }, [])

  return token
}
