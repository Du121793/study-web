// 原生組件
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
// method
import adminService from '../../../../method/adminService'
import userService from '../../../../method/userService'

import addIcon from '../../../../public/course/addIcon.png'
// style
import style from './style.module.css'
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
    <div className={style['edit-QA-main']}>
      {QAInfo && (
        <div
          className={style['form-area']}
          onClick={(e) => e.stopPropagation()}>
          <div className={style['title']}>編輯提問功能</div>

          {/* 主題區 */}
          <div className={style['theme-area']}>
            <div className={style['content']}>輸入主題</div>
            <input
              type="text"
              onChange={(e) => setThemeInput(e.target.value)}
            />
            <Image
              src={addIcon}
              className={style['add-icon']}
              onClick={addNewTheme}
              alt="add theme icon"
              width={24}
              height={24}
            />
            <button
              className={style['g-blue-btn']}
              onClick={() => {
                getAllThemeHint()
                setShowAllTheme(true)
                setShowAllHint(false)
              }}>
              根據現有主題新增
            </button>
            {showAllTheme && (
              <button
                className={style['g-red-btn']}
                onClick={() => setShowAllTheme(false)}>
                關閉
              </button>
            )}
          </div>

          {showAllTheme && (
            <div className={style['themes']}>
              <div className={style['content']}>可將主題拖曳至下方區域</div>
              {allTheme.map((item, index) => (
                <div
                  key={index}
                  className={style['theme']}
                  onClick={() => {
                    if (!themeTemp.includes(item)) {
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

          <div
            className={style['themes']}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const droppedTheme = e.dataTransfer.getData('text/plain')
              setThemeTemp((prev) => (prev.includes(droppedTheme) ? prev : [...prev, droppedTheme]))
            }}>
            <div className={style['content']}>點擊單下可移除</div>
            {themeTemp.map((item, index) => (
              <div
                className={style['theme']}
                title="點擊移除"
                key={index}
                onClick={() => setThemeTemp(themeTemp.filter((t) => t !== item))}>
                {item}
              </div>
            ))}
          </div>

          {/* 標籤區 */}
          <div className={style['hints-area']}>
            <div className={style['content']}>輸入標籤</div>
            <input
              type="text"
              onChange={(e) => setHintInput(e.target.value)}
            />
            <Image
              src={addIcon}
              className={style['add-icon']}
              onClick={addNewHint}
              alt="add hint icon"
              width={24}
              height={24}
            />
            <button
              className={style['g-blue-btn']}
              onClick={() => {
                getAllThemeHint()
                setShowAllHint(true)
                setShowAllTheme(false)
              }}>
              根據現有標籤新增
            </button>
            {showAllHint && (
              <button
                className={style['g-red-btn']}
                onClick={() => setShowAllHint(false)}>
                關閉
              </button>
            )}
          </div>

          {showAllHint && (
            <div className={style['hints']}>
              <div className={style['content']}>可將標籤拖曳至下方區域</div>
              {allHint.map((item, index) => (
                <div
                  key={index}
                  className={style['hint']}
                  onClick={() => {
                    if (!hintTemp.includes(item)) {
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
            className={style['hints']}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const droppedHint = e.dataTransfer.getData('text/plain')
              setHintTemp((prev) => (prev.includes(droppedHint) ? prev : [...prev, droppedHint]))
            }}>
            <div className={style['content']}>點擊單下可移除</div>
            {hintTemp.map((item, index) => (
              <div
                className={`${style['hint']} ${style['selected-hint']}`}
                key={index}
                onClick={() => setHintTemp(hintTemp.filter((h) => h !== item))}>
                {item}
              </div>
            ))}
          </div>

          {/* 問題描述 */}
          <div className={style['description-area']}>
            <div className={style['content']}>問題描述</div>
            <textarea
              className={style['textarea']}
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="請輸入問題描述"
            />
          </div>

          {/* 圖片區 */}
          <div className={style['image-area']}>
            {QAInfo.image?.map((item, index) => (
              <div
                key={index}
                className={style['image-container']}>
                <Image
                  src={`${imageURL}/${item}?token=${splitToken}`}
                  alt="QA image"
                  className={style['image']}
                  width={100}
                  height={0}
                  style={{ height: 'auto' }}
                />
                <div
                  className={style['content']}
                  onClick={(e) => {
                    saveRemoveTemp(e.target.innerText, 'old', index)
                    e.target.innerText === '移除' ? (e.target.innerText = '還原') & e.target.classList.add(style['active']) : (e.target.innerText = '移除') & e.target.classList.remove(style['active'])
                  }}>
                  移除
                </div>
              </div>
            ))}
            {previewUrl.map((item, index) => (
              <div
                key={index}
                className={style['image-container']}>
                <Image
                  src={item}
                  alt="preview"
                  className={style['image']}
                  width={100}
                  height={0}
                  style={{ height: 'auto' }}
                />
                <div
                  className={style['content']}
                  onClick={(e) => {
                    saveRemoveTemp(e.target.innerText, 'new', previewImage[index])
                    e.target.innerText === '移除' ? (e.target.innerText = '還原') & e.target.classList.add(style['active']) : (e.target.innerText = '移除') & e.target.classList.remove(style['active'])
                  }}>
                  移除
                </div>
              </div>
            ))}
            <div
              className={style['add-icon']}
              onClick={() => fileInputRef.current.click()}>
              <div className={style['content']}>新增圖片</div>
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

          {/* 按鈕區 */}
          <div className={style['btns-area']}>
            <button
              className={style['submit']}
              onClick={() => {
                submitEdit()
                page_body.style.overflow = 'auto'
              }}>
              完成並送出
            </button>
            <button
              className={style['cancel']}
              onClick={() => {
                setShowEditQAUI(false)
                page_body.style.overflow = 'auto'
              }}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
