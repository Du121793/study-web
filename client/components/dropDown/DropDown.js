/*
-----------------------------
需要:
dataList(Array) -- 資料列表
setReturnValue (useState) -- 回傳值

點擊事件觸發更改父組件值
useEffect(() => {
    setdata(returnValue)
  }, [returnValue])

JSX使用:
{flag && 
    <contianer>
        <input />
        <component>
    </contianer>
}
-----------------------------
*/
import style from './style.module.css'
export default function DropDown({ dataList, setReturnValue }) {
  if (!dataList) return <></>
  return (
    <ul className={`${style['dropdown']}`}>
      {dataList.map((item, idx) => (
        <li
          key={idx}
          onMouseDown={() => {
            setReturnValue(item)
          }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/*
example:
// input的下拉式選單
const [gradeList, setGradeList] = useState([])
const [gradeListFlag, setGradeListFlag] = useState(false)
const [returnValue, setReturnValue] = useState('')
const handleBlur = () => {
setTimeout(() => {
    setGradeListFlag(false)
    }, 20)
}

  
useEffect(() => {
    setGradeInput(returnValue)
}, [returnValue])
  
<div className={style['input-area']}>
    <input
        type="text"
        onFocus={() => {
            setGradeListFlag(true)
        }}
        onBlur={() => {
            handleBlur()
        }}
        onChange={(e) => {
        setGradeListFlag(false)
        setGradeInput(e.target.value)
        }}
        value={gradeInput}
    />
    {gradeListFlag && (
    <DropDown
        setReturnValue={setReturnValue}
        dataList={gradeList}></DropDown>
    )}
</div>
*/
