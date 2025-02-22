import { useEffect, useState } from "react";
import adminService from "../methods/service/adminService";
import { useUserToken } from "../methods/service/useUserToken";
import MenberSelector from "./memberSelector";
export default function registerCourse() {
  // 子組件
  const [selectedStudentId, setSelectedStudentId] = useState([]);
  // 父組件 (目前)
  const [message, setMessage] = useState("");
  const [courseSelectOption, setCourseSelectOption] = useState("");
  const [searchStudentOption, setSearchStudentOption] = useState({
    username: "",
    phoneNumber: "",
    role: "",
    grade: "",
  });
  const token = useUserToken();
  // 請求參數
  const [getedCourse, setGetedCourse] = useState({ courses: [] });
  const [subject, setSubject] = useState("");
  const [courseName, setCourseName] = useState("");
  const [grade, setGrade] = useState("");
  const [courseClass, setCourseClass] = useState("");

  // 獲取所有課程，用於select
  useEffect(() => {
    if (token) {
      try {
        adminService.getCourses(token).then((res) => {
          setGetedCourse(res.data);
        });
      } catch (e) {
        alert(e);
      }
    }
  }, [token]);

  // 按下"加入到課程"的函式，將選擇的人加入到指定課程
  const registerCourse = async () => {
    const alert = document.querySelector(".alert");
    try {
      if (courseSelectOption != "") {
        await adminService.registerMember(token, {
          user_ids: selectedStudentId, // 可以是陣列
          course_id: courseSelectOption,
        });
        setMessage("加入成功");
        alert.style.backgroundColor = "#a0db6c";
        alert.style.opacity = "1";
        alert.style.height = "60px";
        setTimeout(() => {
          alert.style.opacity = "0";
          alert.style.height = "0";
        }, 2000);
      } else {
        setMessage("加入失敗，必須選擇課程");
        alert.style.backgroundColor = "#dd7171";
        alert.style.opacity = "1";
        alert.style.height = "60px";
        setTimeout(() => {
          alert.style.opacity = "0";
          alert.style.height = "0";
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      if (error.response.data === "請提供有效的學生 ID 陣列") {
        setMessage("加入失敗，請選擇要加入該課程的學生");
      } else if (error.status === "500") {
        setMessage("伺服器發生錯誤，加入失敗");
      }
      alert.style.backgroundColor = "#dd7171";
      alert.style.opacity = "1";
      alert.style.height = "60px";
      setTimeout(() => {
        alert.style.opacity = "0";
        alert.style.height = "0";
      }, 2000);
    }
  };
  //  按下"移除出課程"的函式，將選擇的人加入到指定課程
  const removeRegisterCourse = async () => {
    const alert = document.querySelector(".alert");
    try {
      const res = await adminService.unRegisterMember(token, {
        user_ids: selectedStudentId, // 可以是陣列
        course_id: courseSelectOption,
      });
      setMessage("移除成功");
      alert.style.backgroundColor = "#a0db6c";
      alert.style.opacity = "1";
      alert.style.height = "60px";
      setTimeout(() => {
        alert.style.opacity = "0";
        alert.style.height = "0";
      }, 2000);
    } catch (error) {
      if (error.response.data === "請提供有效的學生 ID 陣列") {
        setMessage("移除失敗，請選擇要移除出該課程的學生");
        alert.style.backgroundColor = "#dd7171";
        alert.style.opacity = "1";
        alert.style.height = "60px";
        setTimeout(() => {
          alert.style.opacity = "0";
          alert.style.height = "0";
        }, 2000);
      }
      if (courseSelectOption === "") {
        setMessage("移除失敗，必須選擇課程");
        alert.style.backgroundColor = "#dd7171";
        alert.style.opacity = "1";
        alert.style.height = "60px";
        setTimeout(() => {
          alert.style.opacity = "0";
          alert.style.height = "0";
        }, 2000);
      } else if (error.status === "500") {
        setMessage("伺服器發生錯誤，移除失敗");
        alert.style.backgroundColor = "#dd7171";
        alert.style.opacity = "1";
        alert.style.height = "60px";
        setTimeout(() => {
          alert.style.opacity = "0";
          alert.style.height = "0";
        }, 2000);
      }
    }
  };
  return (
    <div className="register-cursor-main">
      <div className="register-cursor-page-header">加入成員至課程系統</div>
      <div className="alert">{message}</div>
      <div className="search-input-area">
        <div className="option-area">
          <span>課程名稱:</span>
          <select
            className="select"
            onChange={(e) => {
              setCourseSelectOption(e.target.value);
            }}
            name=""
            id=""
          >
            <option value="">請選擇</option>
            {getedCourse.courses &&
              getedCourse.courses.map((item) => (
                <option value={item._id}>{item.courseName}</option>
              ))}
          </select>
        </div>
        <div className="option-area">
          <span>年級:</span>
          <input
            onChange={(e) => {
              setGrade(e.target.value);
            }}
            id="grade"
            type="text"
          />
        </div>
        <div className="option-area">
          <span>科目:</span>
          <input
            onChange={(e) => {
              setSubject(e.target.value);
            }}
            id="subject"
            type="text"
          />
        </div>
        <div className="option-area">
          <span>班級:</span>
          <input
            onChange={(e) => {
              setCourseClass(e.target.value);
            }}
            id="class"
            type="text"
          />
        </div>
      </div>

      <MenberSelector
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
      ></MenberSelector>
      <div className="sumbits">
        <div className="submit" onClick={registerCourse}>
          加入到課程
        </div>
        <div className="submit remove" onClick={removeRegisterCourse}>
          移除出課程
        </div>
      </div>
    </div>
  );
}
