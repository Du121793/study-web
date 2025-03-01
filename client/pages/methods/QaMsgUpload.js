// QAMsgUpload.js (MyUploadComponent)
// 組件庫
import React, { use, useState } from 'react'
// TSU
import { Upload } from 'tus-js-client'
import videoUploader from '../../method/videoUploader'
// 外部method
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
}) {
  /* 控制上傳狀態 */
  const [uploads, setUploads] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  /* 第一次請求拿到上傳影片的Link與留言ID */
  const [uploadLink, setUploadLink] = useState(null)
  const [commentID, setCommentID] = useState(null)

  // 這個函式就是「開始上傳」的按鈕點擊事件
  const handleTusUpload = async () => {
    if (uploading) return
    setUploading(true)

    try {
      // 先轉成 base64
      let base64Array = []
      if (images && images.length > 0) {
        base64Array = await Promise.all(
          images.map((imgFile) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target.result)
              reader.onerror = (err) => reject(err)
              reader.readAsDataURL(imgFile)
            })
          })
        )
      }

      // (2) 送出留言並取得 uploadLink、commentID
      const res = await userService.submitQaMessage(token, question_id, {
        content,
        image: base64Array,
        fileSize,
        isPrivate,
        isBest,
      })

      const { uploadLink, commentID } = res.data
      setUploadLink(uploadLink)
      setCommentID(commentID)

      console.log('submitQaMessage 結果:', res)
      console.log('取得的 uploadLink:', uploadLink)

      // (3) 若沒有要上傳影片，就結束
      if (!file) {
        console.log('沒有影片需要上傳，流程結束')
        setUploadSuccess(true)
        return
      }

      // (4) 若沒有拿到 uploadLink，通知後端失敗
      if (!uploadLink) {
        console.error('後端沒有回傳 uploadLink, 上傳影片失敗')
        await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
        return
      }

      // (5) 開始 Tus 上傳
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
          console.log('TUS 上傳成功')
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
