import { useEffect, useState } from 'react'

export default function myCourse() {
  const colors = ['red', 'yellow', 'blue', 'gray', 'purple', 'red', 'yellow', 'blue', 'gray', 'purple']
  const showInfo = (e) => {
    console.log(e.target.parentNode.className)
    if (e.target.parentNode.style.height === '80px') {
      e.target.parentNode.style.height = '300px'
    } else if(e.target.parentNode.style.height != '80px') {
      e.target.parentNode.style.height = '80px'
    }
  }
  const randomColor = () => {
    let randomNumber = Math.random()
    randomNumber = randomNumber * 10
    return colors[parseInt(randomNumber)]
  }
  const courses = [
    { id: 1, name: '陽明中學甲班一年級物理', introduce: '一堂與活潑有趣的老師一起學習物理知識的課程', Member: 55, classNumber: '1000' },
    { id: 2, name: '陽明高中乙班一年級物理', introduce: '一堂與活潑有趣的老師一起學習物理知識的課程', Member: 55, classNumber: '1000' },
    { id: 3, name: '陽明大學丙班一年級物理', introduce: '一堂與活潑有趣的老師一起學習物理知識的課程', Member: 55, classNumber: '1000' },
  ]
  return (
    <div className="myCourse-main">
      <div className="header flex justify-center relative">
        <div className="title">我的課程</div>
      </div>
      <div className="courses-container flex-col align-center">
        <ul className="courses flex-col align-center">
          {courses.map((item) => (
            <li
              className="course"
              key={item.id}
              style={{ height: '80px' }}>
              <div
                className="course-header flex align-center"
                onClick={showInfo}>
                <div
                  className="course-fake-img"
                  style={{ backgroundColor: randomColor() }}></div>
                <div className="course-name">課程名稱 : {item.name}</div>
                <div className="class-number">課號:{item.classNumber}</div>
              </div>
              <div className="course-info">
                <div className="introduce">
                  <span>課程介紹: </span>
                  {item.introduce}
                </div>
                <div className="max-member">
                  <span>學生人數: </span>
                  {item.Member}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
