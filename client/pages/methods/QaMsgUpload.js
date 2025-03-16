import React, { use, useState } from 'react'
import { Upload } from 'tus-js-client'
import videoUploader from '../../method/videoUploader'
import userService from '../../method/userService'

export default function QAMsgUpload({
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
  // 組成 FormData
  const formData = new FormData()
  formData.append('content', content)
  if (fileSize) formData.append('fileSize', fileSize)
  formData.append('isPrivate', isPrivate)
  formData.append('isBest', isBest)
  // ★ 將多張圖片依序 append，key 皆為 "image" ★
  if (images && images.length > 0) {
    images.forEach((imgFile) => {
      console.log(imgFile)
      formData.append('image', imgFile)
    })
  }

  // console.log(formData.get('content'))

  /* 控制上傳狀態 */
  const [uploads, setUploads] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  /* 第一次請求拿到上傳影片的Link與留言ID */
  const [uploadLink, setUploadLink] = useState(null)
  const [commentID, setCommentID] = useState(null)

  // 「開始上傳」按鈕事件
  const handleTusUpload = async () => {
    // console.log(question_id)
    if (uploading) return
    setUploading(true)

    try {
      // (1) 送出留言並取得 uploadLink、commentID
      const res = await userService.submitQaMessage(token, question_id, formData)
      console.log(res)
      if (res.success === true && Object.keys(res.data.uploadLink).length === 0) {
        console.log('設定submitSuccess')
        setSubmitSuccess(!submitSuccess)
      }

      // 檢查是否有上傳影片，與是否正常上傳留言
      const { uploadLink, commentID } = res.data

      setUploadLink(uploadLink)
      setCommentID(commentID)

      // (2) 若沒有要上傳影片，就結束
      if (!file) {
        console.log('沒有影片需要上傳，流程結束')
        setUploadSuccess(true)
        return
      }

      // (3) 若沒有拿到 uploadLink，通知後端失敗
      if (!uploadLink) {
        console.error('後端沒有回傳 uploadLink, 上傳影片失敗')
        await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
        return
      }

      // (4) 開始 Tus 上傳
      const uploadId = Date.now() + '-' + file.name
      const tusUpload = new Upload(file, {
        uploadUrl: uploadLink,
        chunkSize: 5 * 1024 * 1024,
        uploadLength: file.size,

        onError: async (error) => {
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
          // 設定反狀態用於更新留言區
          setSubmitSuccess(!submitSuccess)
          try {
            const response = await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, true)
            console.log('回傳後端成功狀態:', response)
          } catch (err) {
            console.error('通知後端失敗: ', err)
          }

          // 上傳完就從進度列表中移除
          setUploads((prev) => prev.filter((u) => u.id !== uploadId))
          setUploadSuccess(true)
        },
      })

      setUploads((prev) => [...prev, { id: uploadId, progress: 0, message: '準備上傳中' }])
      tusUpload.start()
    } catch (err) {
      console.error('handleTusUpload流程失敗:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div>
        {uploads.map((upload) => (
          <div
            key={upload.id}
            style={{ marginBottom: '8px' }}>
            <p>進度: {upload.progress}%</p>
          </div>
        ))}
      </div>
      <button onClick={handleTusUpload}>{uploading ? '上傳中...' : '開始上傳'}</button>
    </div>
  )
}
