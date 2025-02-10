# 請求用戶資料
import { useUserToken } from '../pages/methods/service/useUserToken'
import userService from '../pages/methods/service/userService'
const [userInfo, setUserInfo] = useState(null)
const token = useUserToken()
useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => {
          setUserInfo(data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])