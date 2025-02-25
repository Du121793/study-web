// QAMsgUpload.js (MyUploadComponent)
import React, { useState } from 'react'
import { Upload } from 'tus-js-client'
import videoUploader from '../methods/service/videoUploader'
import userService from '../methods/service/userService'

function QAMsgUpload({
  token,
  question_id,
  file, // 影片檔案 (File)
  images, // 圖片檔案陣列 (File[])
  content,
  fileSize,
  isPrivate,
  isBest,
}) {
  const [uploads, setUploads] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 這個函式就是「開始上傳」的按鈕點擊事件
  const handleTusUpload = async () => {
    // 避免重複點擊
    if (uploading) return

    try {
      setUploading(true)

      // (1) 先把圖片(File)轉成 Base64
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

      // (2) 先呼叫後端api: 送出留言(文字＋圖片) & 拿到 uploadLink
      const res = await userService.submitQaMessage(token, question_id, {
        content,
        image: base64Array,
        fileSize, // 若有影片才要帶size，沒影片可以帶0或不帶
        isPrivate,
        isBest,
      })

      console.log('submitQaMessage 結果:', res)
      const uploadLink = res.data.uploadLink
      const commentID = res.data.commentID

      // (3) 若沒有要上傳影片，就結束
      if (!file) {
        console.log('沒有影片需要上傳，流程結束')
        setUploadSuccess(true) // 代表整個流程都OK
        return
      }

      // 如果 uploadLink 不存在 → 回報後端上傳失敗
      if (!uploadLink) {
        console.error('後端沒有回傳uploadLink, 上傳影片失敗')
        await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
        return
      }

      // (4) 有影片的話，開始 TUS 上傳
      let uploadId = Date.now() + '-' + file.name
      const tusUpload = new Upload(file, {
        uploadUrl: uploadLink,
        chunkSize: 5 * 1024 * 1024,
        uploadLength: file.size,

        // 上傳失敗
        onError: async (error) => {
          console.error('TUS 上傳失敗:', error)
          setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))
          try {
            await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
          } catch (err) {
            console.error('通知後端失敗: ', err)
          }
        },

        // 上傳進度
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
          setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
        },

        // 上傳完成
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

      // (5) 註冊到 uploads，然後開始上傳
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
      <button onClick={handleTusUpload}>{uploading ? '上傳中...' : '開始上傳'}</button>

      <div>
        {uploads.map((upload) => (
          <div
            key={upload.id}
            style={{ marginBottom: '8px' }}>
            <p>上傳ID: {upload.id}</p>
            <p>狀態: {upload.message}</p>
            <p>進度: {upload.progress}%</p>
          </div>
        ))}
      </div>

      {uploadSuccess && <p>整個流程成功結束！</p>}
    </div>
  )
}

export default QAMsgUpload
