export default function myCourse() {
  const courses = [
    { name: '物理', id: 1 },
    { name: '國文', id: 2 },
    { name: '數學', id: 3 },
  ]
  return (
    <div className="my-course-main">
      <div className="my-course-container">
        <div className="header">
          <div className="title">我的課程</div>
        </div>
        <div className="contetn">
          <div className="my-course-nav">
            <nav>
              <ul>
                <span>課程</span>
                {courses.map((item, index) => (
                  <li key={index}>{item.name}</li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
