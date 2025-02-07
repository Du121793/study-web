import Image from 'next/image'
import Link from 'next/link'
import shotA from '../../public/profile/shot1.jpg'
import shotB from '../../public/profile/shot2.jpg'
import shotC from '../../public/profile/shot3.jpg'
export default function myCourse() {
  const curserBaseUrl = 'http://localhost:3000/courses/course'
  const shots = [shotA, shotB, shotC, shotA, shotB, shotC, shotA, shotB, shotC, shotA]
  const randomShot = () => {
    let randomNumber = Math.random()
    randomNumber = randomNumber * 10
    return shots[parseInt(randomNumber)]
  }
  const getCourses = [
    { subject: '物理', grade: '國中', courseClass: '甲班', courseName: '物理國中甲班', id: '1' },
    { subject: '化學', grade: '高中', courseClass: '乙班', courseName: '化學高中乙班', id: '2' },
    { subject: '數學', grade: '大學', courseClass: '丙班', courseName: '數學大學丙班', id: '3' },
  ]
  return (
    <div className="myCourse-main">
      <div className="courses-container flex-col align-center">
        <ul className="courses flex-col align-center">
          {getCourses.map((item) => (
            <li
              className="course"
              key={item.id}
              style={{ height: '80px' }}>
              <Link
                className="link"
                href={curserBaseUrl + `?courseName=${item.courseName}`}>
                <div className="course-header flex align-center">
                  <div className="course-fake-shot">
                    <Image
                      className="shot"
                      src={randomShot()}
                      alt="cursor shot"
                      width={100}
                      height={100}></Image>
                  </div>
                  <div className="course-name">{item.courseName}</div>
                  <div className="class-number">課號:{item.id}</div>
                </div>
              </Link>

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
