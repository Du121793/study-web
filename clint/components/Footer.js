export default function Footer() {
  const info = {
    address: '嘉義縣',
    phone: '09-xxxxxxxx',
    fax: '45-23415648',
    email: '123456@gmail.com',
    Ext: '4567',
  }

  return (
    <div className="footer-main">
      <div className="horizontal-line"></div>
      <div className="footer-container">
        <div className="related-links">
          <span>相關連結:</span>
        </div>
        <div className="contact">
          <p className="title">聯絡資訊:</p>
          <span>地址:{info.address}</span>
          <span>TEL:{info.phone}</span>
          <span>FAX:{info.fax}</span>
          <span>
            平台使用障礙與相關諮詢請來信 {info.email} 或分機{info.Ext}，謝謝。
          </span>
        </div>
      </div>
    </div>
  )
}
