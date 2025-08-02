import style from './style.module.css'
export default function LoadingAnime({ top, left, right, bottom }) {
  return (
    <div
      className={style.loading_main}
      style={{ top: top ? top : '50%', left: left ? left : 'none', right: right ? right : 'none', bottom: bottom ? bottom : 'none' }}>
      <div className={style.loader}></div>
    </div>
  )
}
