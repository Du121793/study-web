// style調用
// global
import '../styles/global/global.css'
import '../styles/global/unlogined.css'
// font
import '../styles/global/font.css'
// index
import '../styles/index/index.css'
// course
// import '../styles/course/course.css'
// import '../styles/course/videoUpload.css'
// import '../styles/course/qaPage.css'
// import '../styles/course/msgBoard.css'
// import '../styles/course/imageZoom.css'
// import '../styles/course/showMoreQA.css'
// import '../styles/course/showPublicQA.css'
// import '../styles/course/accessSetting.css'
// import '../styles/course/studentSelector.css'
// import '../styles/course/videoSelector.css'
// course/component
import '../styles/course/component/editVideoInfo.css'
import '../styles/component/QA/editQA.css'
import '../styles/course/component/uploadOldVimeoVDO.css'
import '../styles/course/component/askQA.css'
import '../styles/course/component/videoNav.css'
import '../styles/course/component/QANav.css'
//method的layout
import '../styles/method/completeInfo.css'
// Favicon
import webTitle from '../public/global/webTitle.ico'
// head
import Head from 'next/head'
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* 網站標題 */}
        <title>王佑物理--最專業的高中物理</title>
        {/* 字元編碼 & 響應式 */}
        <meta charSet="utf-8" />
        <meta
          name="language"
          content="tw"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
          name="copyright"
          content="Copyright © 2025 王佑物理. All rights reserved."
        />
        <meta
          name="description"
          content="港明中學宿舍斜對面，只收港明的數理補習班，最專業的高中物理 - 王佑物理，我們聚焦於目標四大四中學生學習需求。"
        />
        <meta
          name="keywords"
          content="王佑物理,王佑物理補習班,物理補習班,補習班,王佑補習"
        />
        {/* Favicon */}
        <link
          rel="icon"
          href={webTitle.src}
        />
      </Head>
      <Component {...pageProps}></Component>
    </>
  )
}

export default MyApp
