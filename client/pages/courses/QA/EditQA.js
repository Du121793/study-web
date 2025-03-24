import { useEffect, useRef, useState } from 'react'
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
import Image from 'next/image'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
// 富文本編輯器
// import ReactQuill from 'react-quill'
// 動態載入禁用 SSR，使 ReactQuill 僅在客戶端載入
const ReactQuillNoSSR = dynamic(() => import('react-quill'), { ssr: false })
// import 'react-quill/dist/quill.bubble.css'
import 'react-quill/dist/quill.snow.css'
//public
import addIcon from '../../../public/course/addIcon.png'
// .env
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
export default function EditQA({ messageControl, setShowEditQAUI, token, question_id, course_id, hadEdit, setHadEdit }) {
  // 路徑處理 用於圖片
  const imageURL = `${serverIp}/resource/questionIMG`
  const [splitToken, setSplitToken] = useState('')
  // 存取原QAInfo
  const [QAInfo, setQAInfo] = useState({})
  // patch請求參數
  const [themeInput, setThemeInput] = useState('')
  const [themeTemp, setThemeTemp] = useState([])
  const [hintInput, setHintInput] = useState('')
  const [hintTemp, setHintTemp] = useState([])
  const [imageTemp, setImageTemp] = useState([])
  const [descriptionInput, setDescriptionInput] = useState([])
  // 需移除圖片的暫存區
  const [oldImageRemoveTemp, setOldImageRemoveTemp] = useState([])
  const [newImageRemoveTemp, setNewImageRemoveTemp] = useState([])
  // 用於預覽圖片
  const [previewUrl, setPreviewUrl] = useState([])
  // 用於代替imageTemp來給saveRemoveTemp()正確的參數
  const [previewImage, setPreviewImage] = useState([])
  // 將預設input的file改為自訂義
  const fileInputRef = useRef(null)
  // 控制body的滑條
  const [page_body, setPage_body] = useState([])

  const test = () => {
    console.log(QAInfo)
  }

  const addNewTheme = () => {
    if (themeInput === '' || themeInput === null) return console.error('主題不能為空')
    if (
      themeTemp.find((item) => {
        return item === themeInput
      })
    ) {
      return console.error('不能有相同主題')
    } else {
      setThemeTemp([...themeTemp, themeInput])
    }
  }

  const addNewHint = () => {
    if (hintInput === '' || hintInput === null) return console.error('標籤不能為空')
    if (
      hintTemp.find((item) => {
        return item === hintInput
      })
    ) {
      return console.error('不能有相同標籤')
    } else {
      setHintTemp([...hintTemp, hintInput])
    }
  }

  const submitEdit = () => {
    if (descriptionInput === '') return console.error('描述不能為空')
    if (question_id === '') return console.error('發生錯誤')
    if (QAInfo.courses === '') return console.error('發生錯誤')
    const formData = new FormData()
    formData.append('question_id', question_id)
    formData.append('description', descriptionInput)
    if (Array.isArray(QAInfo.courses)) {
      QAInfo.courses.forEach((item) => {
        formData.append('course_ids[]', item)
      })
    }

    if (Array.isArray(themeTemp)) {
      themeTemp.forEach((item) => {
        formData.append('resourceCategories', item)
      })
    }

    if (Array.isArray(hintTemp)) {
      hintTemp.forEach((item) => {
        formData.append('hints', item)
      })
    }

    if (Array.isArray(oldImageRemoveTemp)) {
      oldImageRemoveTemp.forEach((item) => {
        formData.append('rmIMG[]', item)
      })
    }

    imageTemp
      .filter((file) => {
        return !newImageRemoveTemp.includes(file)
      })
      .forEach((file) => {
        formData.append('image', file)
      })

    adminService.editQAInfo(token, formData, course_id).then((res) => {
      if (res.success) {
        console.log(res)
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
        console.error('請求QA資料發生錯誤')
        console.error(res)
      }
    })
  }, [token, question_id])

  // 當組件卸載時釋放該 URL 以節省資源
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
          onClick={(e) => {
            e.stopPropagation()
          }}>
          <div
            className="title"
            onClick={test}>
            編輯提問功能
          </div>
          <div className="theme-area">
            <div className="content">輸入主題</div>
            <input
              type="text"
              onChange={(e) => {
                setThemeInput(e.target.value)
              }}
            />
            <Image
              src={addIcon}
              className="add-icon"
              onClick={() => {
                addNewTheme()
              }}
              alt="add theme icon"
              width={24}
              height={24}></Image>
          </div>
          <div className="themes">
            {QAInfo.resourceCategories &&
              themeTemp.map((item, index) => (
                <div
                  className="theme"
                  key={index}>
                  {item}
                </div>
              ))}
          </div>
          <div className="hints-area">
            <div className="content">輸入標籤</div>
            <input
              type="text"
              onChange={(e) => {
                setHintInput(e.target.value)
              }}
            />
            <Image
              src={addIcon}
              className="add-icon"
              onClick={() => {
                addNewHint()
              }}
              alt="add theme icon"
              width={24}
              height={24}></Image>
          </div>
          <div className="hints">
            {QAInfo.hints &&
              hintTemp.map((item, index) => (
                <div
                  className="hint"
                  key={index}>
                  {item}
                </div>
              ))}
          </div>
          <div className="description-area">
            <div className="content">問題描述</div>
          </div>
          <ReactQuillNoSSR
            className="react-quill"
            theme="snow"
            onChange={(e) => {
              setDescriptionInput(e)
            }}
          />
          {/* 舊有圖片 */}
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
            {/* 新進圖片 */}
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
            {/* 加號Image */}
            <div>
              <div
                className="add-icon"
                onClick={() => {
                  fileInputRef.current.click()
                }}>
                <div className="content">新增圖片</div>
                <Image
                  src={addIcon}
                  alt="add image icon"
                  width={24}
                  height={24}></Image>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  setImageTemp([...imageTemp, e.target.files[0]])
                  setPreviewImage([...previewImage, e.target.files[0]])
                  if (previewUrl.length === 0) {
                    setPreviewUrl([URL.createObjectURL(e.target.files[0])])
                  }
                  setPreviewUrl([...previewUrl, URL.createObjectURL(e.target.files[0])])
                }}
              />
            </div>
          </div>
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
