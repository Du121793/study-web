import React, { useRef, useState, useEffect } from 'react'
import { Upload } from 'tus-js-client'
import videoUploader from '../../method/videoUploader'
import userService from '../../method/userService'
// 假設有對應的 scss 檔案，如下方範例 (QAMsgUpload.module.scss)
import styles from '../../styles/course/methods/qaMsgUpload.module.css'

export default function QAMsgUpload({
  messageControl,
  token,
  question_id,
  file, // 影片檔案 (File)
  images, // 圖片檔案陣列 (File[])
  content,
  fileSize,
  isPrivate,
  isBest,
  submitSuccess,
  setSubmitSuccess,
}) {
  const [uploadLock, setUploadLock] = useState(false)
  const formData = new FormData()
  formData.append('content', content)
  if (fileSize) formData.append('fileSize', fileSize)
  formData.append('isPrivate', isPrivate)
  formData.append('isBest', isBest)
  if (images && images.length > 0) {
    images.forEach((imgFile) => {
      formData.append('image', imgFile)
    })
  }

  /* 控制上傳狀態 */
  const [uploads, setUploads] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  /* 第一次請求拿到上傳影片的Link與留言ID */
  const [uploadLink, setUploadLink] = useState(null)
  const [commentID, setCommentID] = useState(null)

  // 新增一個狀態來存儲待上傳的文件
  const [pendingFile, setPendingFile] = useState(null)

  // 一旦拿到 uploadLink，就開始上傳
  useEffect(() => {
    if (uploadLink && pendingFile) {
      startTusUpload(pendingFile)
      setPendingFile(null)
    }
  }, [uploadLink])

  // TUS 上傳邏輯
  const startTusUpload = (file) => {
    const uploadId = Date.now() + '-' + file.name
    const tusUpload = new Upload(file, {
      endpoint: uploadLink,
      uploadUrl: uploadLink,
      chunkSize: 5 * 1024 * 1024,
      uploadLength: file.size,

      onError: async (error) => {
        messageControl('上傳失敗', false)
        console.error('TUS 上傳失敗:', error)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))
        try {
          await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
        } catch (err) {
          console.error('通知後端失敗: ', err)
        }
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
      },

      onSuccess: async () => {
        messageControl('上傳成功', true)
        setSubmitSuccess(!submitSuccess)
        try {
          await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, true)
        } catch (err) {
          console.error('通知後端失敗: ', err)
        }
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
        setUploadSuccess(true)
      },
    })

    setUploads((prev) => [...prev, { id: uploadId, progress: 0, message: '準備上傳中' }])
    tusUpload.start()
  }

  // 「開始上傳」按鈕事件
  const handleTusUpload = async () => {
    if (uploading || uploadLock) return
    setUploadLock(true)
    setUploading(true)

    try {
      // 送出留言並取得 uploadLink、commentID
      const res = await userService.submitQaMessage(token, question_id, formData)

      // 若回應成功但沒有 uploadLink，代表沒有影片要上傳
      if (res.success === true && !res.data.uploadLink) {
        // setSubmitSuccess取返來更新父組件的留言區狀態
        setSubmitSuccess(!submitSuccess)
        setUploadLock(false)
      }

      if (res.success) {
        if (res.data.uploadLink) {
          const { uploadLink } = res.data
          setUploadLink(uploadLink)
        }
        if (res.data.commentID) {
          const { commentID } = res.data
          setCommentID(commentID)
        }

        // 若後端沒有回傳 uploadLink，但回傳了 commentID
        if (!uploadLink && commentID) {
          await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
          setUploadLock(false)
          setSubmitSuccess(!submitSuccess)
          return
        }
      } else {
        console.error('上傳失敗', res)
      }

      // 沒有影片檔案就直接完成
      if (!file) {
        setUploadSuccess(true)
        setUploadLock(false)
        setSubmitSuccess(!submitSuccess)
        return
      }

      // 有影片檔案要上傳
      setPendingFile(file)
    } catch (err) {
      console.error('handleTusUpload流程失敗:', err)
    } finally {
      setUploadLock(false)
      setUploading(false)
    }
  }

  return (
    <div>
      {/* 當上傳列表為空時才顯示按鈕（也就是還沒開始上傳） */}
      {uploads.length === 0 && (
        <button
          style={{ cursor: 'pointer' }}
          onClick={handleTusUpload}>
          {uploading ? '上傳中...' : '開始上傳'}
        </button>
      )}

      {/* 進度條區塊：只要有檔案在上傳，就顯示這個區域 */}
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className={styles.progressContainer} // <== 這裡要改用 {styles.xxx}
        >
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${upload.progress}%` }}
            />
            填充文字填充文字
          </div>
        </div>
      ))}
    </div>
  )
}
