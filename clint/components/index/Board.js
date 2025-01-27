import board1 from '../../public/imgs/board1.png'
import Image from 'next/image'
export default function Board() {
  const info = {
    address: '嘉義縣',
    phone: '09-xxxxxxxx',
    fax: '45-23415648',
    email: '123456@gmail.com',
    Ext: '4567',
  }
  const images = [board1, board1, board1, board1]
  const boardData = [{ title: '鯨魚會大便鯨魚會大便鯨魚會大便鯨魚會大便鯨魚會大便' }, { title: '海獅是同性戀海獅是同性戀海獅是同性戀海獅是同性戀海獅是同性戀' }, { title: '鄭霖恩改過向善鄭霖恩改過向善鄭霖恩改過向善鄭霖恩改過向善' }]
  return (
    <div className="main">
      <div className="board-container">
        <div className="container-left"></div>
        <div className="container-middle">
          <div className="title">
            <span>公告事項</span>
          </div>
          <div className="horizontal-line"></div>
          <div className="board-container">
            <div className="board-option">
              <ul>
                <li>綜合活動</li>
                <li>課程公告</li>
              </ul>
            </div>
            <div className="vertical-line"></div>
            <div className="board-info">
              <ul>
                {boardData.map((item, index) => (
                  <li key={index}>{item.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="container-right"></div>
      </div>
      <div className="board-image-container">
        <ul>
          {images.map((item, index) => (
            <li key={index}>
              <Image
                className="image"
                src={item}
                alt="border images"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
