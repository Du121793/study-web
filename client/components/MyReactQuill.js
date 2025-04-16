// MyReactQuill.js
import React from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// 註冊自訂的 size 格式，並定義允許的數值（以 px 為單位）
const Size = Quill.import('formats/size')
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '24px']
Quill.register(Size, true)

const defaultModules = {
  toolbar: [
    // 你可以保留 header 與 font 的選項
    [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
    [{ color: [] }, { background: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
}

const defaultFormats = ['header', 'font', 'size', 'color', 'background', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image', 'video', 'align']

const MyReactQuill = ({ value, onChange, modules = defaultModules, formats = defaultFormats, ...props }) => {
  return (
    <ReactQuill
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      {...props}
    />
  )
}

export default MyReactQuill
