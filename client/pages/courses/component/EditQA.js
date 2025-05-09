import { useEffect, useRef, useState } from 'react'
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
import Image from 'next/image'
import addIcon from '../../../public/course/addIcon.png'

const serverIp = process.env.NEXT_PUBLIC_SERVER_IP

export default function EditQA({ setLoading, messageControl, setShowEditQAUI, token, question_id, course_id, hadEdit, setHadEdit }) {
  const imageURL = `${serverIp}/resource/questionIMG`
  const [splitToken, setSplitToken] = useState('')
  const [QAInfo, setQAInfo] = useState({})
  // 主題與標籤相關
  const [themeInput, setThemeInput] = useState('')
  const [themeTemp, setThemeTemp] = useState([])
  const [hintInput, setHintInput] = useState('')
  const [hintTemp, setHintTemp] = useState([])
  // 編輯描述，原本使用 ReactQuill，改用 textarea，故設為字串型態
  const [descriptionInput, setDescriptionInput] = useState('')
  // 新增/移除圖片相關
  const [imageTemp, setImageTemp] = useState([])
  const [oldImageRemoveTemp, setOldImageRemoveTemp] = useState([])
  const [newImageRemoveTemp, setNewImageRemoveTemp] = useState([])
  const [previewUrl, setPreviewUrl] = useState([])
  const [previewImage, setPreviewImage] = useState([])
  const fileInputRef = useRef(null)
  const [page_body, setPage_body] = useState([])
  // get 存取所有主題與標籤
  const [allTheme, setAllTheme] = useState([])
  const [allHint, setAllHint] = useState([])
  // 點擊根據xx新增
  const [showAllTheme, setShowAllTheme] = useState(false)
  const [showAllHint, setShowAllHint] = useState(false)

  const addNewTheme = () => {
    if (!themeInput) return console.error('主題不能為空')
    if (themeTemp.includes(themeInput)) {
      return console.error('不能有相同主題')
    } else {
      setThemeTemp([...themeTemp, themeInput])
    }
  }

  const addNewHint = () => {
    if (!hintInput) return console.error('標籤不能為空')
    if (hintTemp.includes(hintInput)) {
      return console.error('不能有相同標籤')
    } else {
      setHintTemp([...hintTemp, hintInput])
    }
  }

  const submitEdit = () => {
    if (!descriptionInput) return console.error('描述不能為空')
    if (!question_id) return console.error('發生錯誤')
    if (!QAInfo.courses) return console.error('發生錯誤')
    const formData = new FormData()
    formData.append('question_id', question_id)
    formData.append('description', descriptionInput)
    if (Array.isArray(QAInfo.courses)) {
      QAInfo.courses.forEach((item) => {
        formData.append('course_ids[]', item)
      })
    }
    themeTemp.forEach((item) => formData.append('resourceCategories', item))
    hintTemp.forEach((item) => formData.append('hints', item))
    oldImageRemoveTemp.forEach((item) => formData.append('rmIMG[]', item))
    imageTemp.filter((file) => !newImageRemoveTemp.includes(file)).forEach((file) => formData.append('image', file))
    
    adminService.editQAInfo(token, formData, course_id).then((res) => {
      if (res.success) {
        setHadEdit(!hadEdit)
        messageControl('編輯完成', true)
        setShowEditQAUI(false)
      } else {
        console.error(res)
        messageControl('編輯失敗', false)
      }
    })
  }

  const saveRemoveTemp = (content, imageIsOldOrNew, value) => {
    if (content === '移除') {
      if (imageIsOldOrNew === 'new') {
        setNewImageRemoveTemp([...newImageRemoveTemp, value])
      }
      if (imageIsOldOrNew === 'old') {
        setOldImageRemoveTemp([...oldImageRemoveTemp, value])
      }
    }
    if (content === '還原') {
      if (imageIsOldOrNew === 'new') {
        setNewImageRemoveTemp(newImageRemoveTemp.filter((item) => item !== value))
      }
      if (imageIsOldOrNew === 'old') {
        setOldImageRemoveTemp(oldImageRemoveTemp.filter((item) => item !== value))
      }
    }
  }

  const getAllThemeHint = () => {
    adminService.getCourseQAsByTag(token, course_id).then((res) => {
      if (res?.success) {
        setAllTheme(res.data.resourceCategories)
        setAllHint(res.data.hints)
      }
    })
  }

  useEffect(() => {
    if (token) {
      setSplitToken(token.split(' ')[1])
    }
    userService.getQaInfo(token, question_id).then((res) => {
      if (res.success) {
        setQAInfo(res.data)
        setThemeTemp(res.data.resourceCategories)
        setHintTemp(res.data.hints)
        setDescriptionInput(res.data.description)
      } else {
        console.error('請求QA資料發生錯誤', res)
      }
    })
  }, [token, question_id])

  // 當組件卸載時釋放預覽圖片的 URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  return (
    <div className="edit-QA-main">
      {QAInfo && (
        <div
          className="form-area"
          onClick={(e) => e.stopPropagation()}>
          <div className="title">編輯提問功能</div>
          {/* 主題區 */}
          <div className="theme-area">
            <div className="content">輸入主題</div>
            <input
              type="text"
              onChange={(e) => setThemeInput(e.target.value)}
            />
            <Image
              src={addIcon}
              className="add-icon"
              onClick={addNewTheme}
              alt="add theme icon"
              width={24}
              height={24}
            />
            <button
              className="g-blue-btn"
              onClick={() => {
                getAllThemeHint()
                setShowAllTheme(true)
                setShowAllHint(false)
              }}>
              根據現有主題新增
            </button>
            {showAllTheme && (
              <button
                className="g-red-btn"
                onClick={() => {
                  setShowAllTheme(false)
                }}>
                關閉
              </button>
            )}
          </div>
          {showAllTheme && (
            <div className="themes">
              <div className="content">可將主題拖曳至下方區域</div>
              {allTheme.map((item, index) => (
                <div
                  key={index}
                  className="theme"
                  onClick={() => {
                    if (!themeTemp.find((theme) => theme === item)) {
                      setThemeTemp([...themeTemp, item])
                    }
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item)
                  }}>
                  {item}
                </div>
              ))}
            </div>
          )}
          {/* 已選擇的主題，設為可拖放區域 */}
          <div
            className="themes"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const droppedTheme = e.dataTransfer.getData('text/plain')
              setThemeTemp((prev) => (prev.includes(droppedTheme) ? prev : [...prev, droppedTheme]))
            }}>
            <div className="content">點擊單下可移除</div>
            {QAInfo.resourceCategories &&
              themeTemp.map((item, index) => (
                <div
                  title="點擊移除"
                  className="theme"
                  key={index}
                  onClick={() => {
                    setThemeTemp(themeTemp.filter((inner) => inner !== item))
                  }}>
                  {item}
                </div>
              ))}
          </div>
          {/* 標籤區 */}
          <div className="hints-area">
            <div
              className="content"
              onClick={() => console.log(hintTemp)}>
              輸入標籤
            </div>
            <input
              type="text"
              onChange={(e) => setHintInput(e.target.value)}
            />
            <Image
              src={addIcon}
              className="add-icon"
              onClick={addNewHint}
              alt="add hint icon"
              width={24}
              height={24}
            />
            <button
              className="g-blue-btn"
              onClick={() => {
                getAllThemeHint()
                setShowAllTheme(false)
                setShowAllHint(true)
              }}>
              根據現有標籤新增
            </button>
            {showAllHint && (
              <button
                className="g-red-btn"
                onClick={() => {
                  setShowAllHint(false)
                }}>
                關閉
              </button>
            )}
          </div>
          {showAllHint && (
            <div className="hints">
              <div className="content">可將標籤拖曳至下方區域</div>
              {allHint.map((item, index) => (
                <div
                  key={index}
                  className="hint"
                  onClick={() => {
                    if (!hintTemp.find((hint) => hint === item)) {
                      setHintTemp([...hintTemp, item])
                    }
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item)
                  }}>
                  {item}
                </div>
              ))}
            </div>
          )}
          <div
            className="hints"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const droppedHint = e.dataTransfer.getData('text/plain')
              setHintTemp((prev) => (prev.includes(droppedHint) ? prev : [...prev, droppedHint]))
            }}>
            <div className="content">點擊單下可移除</div>
            {QAInfo.hints &&
              hintTemp.map((item, index) => (
                <div
                  className="selected-hint hint"
                  key={index}
                  onClick={() => {
                    setHintTemp(hintTemp.filter((inner) => item !== inner))
                  }}>
                  {item}
                </div>
              ))}
          </div>
          {/* 問題描述 */}
          <div className="description-area">
            <div className="content">問題描述</div>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="請輸入問題描述"
              className="textarea"
            />
          </div>
          {/* 圖片區 */}
          <div className="image-area">
            {QAInfo.image &&
              QAInfo.image.map((item, index) => (
                <div
                  key={index}
                  className="image-container">
                  <Image
                    src={`${imageURL}/${item}?token=${splitToken}`}
                    alt="QA images"
                    className="image"
                    width={100}
                    height={0}
                    style={{ height: 'auto' }}
                  />
                  <div
                    className="content"
                    onClick={(e) => {
                      saveRemoveTemp(e.target.innerText, 'old', index)
                      if (e.target.innerText === '移除') {
                        e.target.innerText = '還原'
                        e.target.classList.add('active')
                      } else if (e.target.innerText === '還原') {
                        e.target.innerText = '移除'
                        e.target.classList.remove('active')
                      }
                    }}>
                    移除
                  </div>
                </div>
              ))}
            {Array.isArray(previewUrl) &&
              previewUrl.map((item, index) => (
                <div
                  key={index}
                  className="image-container">
                  <Image
                    src={item}
                    alt="預覽圖片"
                    className="image"
                    width={100}
                    height={0}
                    style={{ height: 'auto' }}
                  />
                  <div
                    className="content"
                    onClick={(e) => {
                      saveRemoveTemp(e.target.innerText, 'new', previewImage[index])
                      if (e.target.innerText === '移除') {
                        e.target.innerText = '還原'
                        e.target.classList.add('active')
                      } else if (e.target.innerText === '還原') {
                        e.target.innerText = '移除'
                        e.target.classList.remove('active')
                      }
                    }}>
                    移除
                  </div>
                </div>
              ))}
            <div>
              <div
                className="add-icon"
                onClick={() => fileInputRef.current.click()}>
                <div className="content">新增圖片</div>
                <Image
                  src={addIcon}
                  alt="add image icon"
                  width={24}
                  height={24}
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  setImageTemp([...imageTemp, e.target.files[0]])
                  setPreviewImage([...previewImage, e.target.files[0]])
                  setPreviewUrl([...previewUrl, URL.createObjectURL(e.target.files[0])])
                }}
              />
            </div>
          </div>
          {/* 按鈕區 */}
          <div className="btns-area">
            <button
              onClick={() => {
                submitEdit()
                page_body.style.overflow = 'auto'
              }}
              className="submit">
              完成並送出
            </button>
            <button
              onClick={() => {
                setShowEditQAUI(false)
                page_body.style.overflow = 'auto'
              }}
              className="cancel">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
