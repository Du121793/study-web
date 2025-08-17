import style from './style.module.css'
export default function LoadingArea({ widthValue = null, heightValue = null, paddingValue, loading }) {
  if (!widthValue || !heightValue) return
  return (
    <div
      className={style['loading-area-main']}
      style={{ width: widthValue, height: heightValue, padding: paddingValue }}></div>
  )
}
