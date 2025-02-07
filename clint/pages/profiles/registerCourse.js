export default function stidentCourse() {
  const pages = [10]
  return (
    <div className="register-cursor-main">
      <div className="search-input-area">
        <span>年級:</span>
        <input type="text" />
        <span>班級:</span>
        <input type="text" />
        <span>課程名稱:</span>
        <input type="text" />
        <button>全選</button>
        <button>取消全選</button>
      </div>
      <div className="register-area">
        <div className="page-switch"></div>
      </div>
      <div className="submit">送出</div>
    </div>
  )
}
