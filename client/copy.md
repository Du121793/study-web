cd client
npm run build
cd ..

git add .
git add .
git commit -m ""
git push origin front-end-dev

git checkout master
git merge front-end-dev
git push
git checkout front-end-dev

rm -r .\server\resource\videoIMG\*
rm -r .\server\resource\questionIMG\*
rm -r .\server\resource\public\board\*

font-size: clamp(28px, 2vw, 34px);
font-size: clamp(16px, 1.2vw, 20px);
cursor: pointer;

@media (max-width: 860px) {}

/* 監聽全局寬度變化，寬度變化設定windowsWidth */ 
  const isClient = typeof window === 'object'
  const [windowsWidth, setWindowsWidth] = useState(0)
  useEffect(() => {
    if (!isClient) return false

    const handleResize = () => {
      setWindowsWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    // 先觸發一次，保證初始值正確
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isClient])


  fix:profile/editcourse layout
  change:profile/backup mode use full
  feat:profile/backup double check and alert popup
  change:profile/background main backgroun color
  