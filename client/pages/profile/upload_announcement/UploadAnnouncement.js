import style from "./style.module.css"
export default function UploadAnnouncement() {
  return (
    <div className={`${style['upload-announcement-main']}`}>
      <div className={`${style['title']}`}>上傳公告功能</div>
      <div className={`${style['search-area']}`}></div>
      <div className={`${style['announcement-area']}`}></div>
    </div>
  )
}
