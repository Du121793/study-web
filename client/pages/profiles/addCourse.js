import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import downArrowImg from "../../public/profile/downArrow.png";
import adminService from "../methods/service/adminService";
import { useUserToken } from "../methods/service/useUserToken";
import MenberSelector from "./memberSelector";

export default function addCourse() {
  const token = useUserToken();
  // 子組件
  const [selectedStudentId, setSelectedStudentId] = useState([]);
  const [createdCourseId, setCreatedCourseId] = useState("");
  // 父組件 (目前)
  const [message, setMessage] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [courseClass, setCourseClass] = useState("");
  const [courseName, setCourseName] = useState("");

  // 請求參數
  let courseInfo = {};

  // 初始化總課程名稱
  useEffect(() => {
    setCourseName(grade + courseClass + subject);
  }, [grade, courseClass, subject]);

  // createdCourseId改變時執行加入課程的請求，用於同步
  useEffect(() => {
    addStudentIntoNewCourse();
  }, [createdCourseId]);

  // 初始化
  const initGrade = (e) => {
    setGrade(e.target.value);
  };
  const initCourseClass = (e) => {
    setCourseClass(e.target.value);
  };
  const initSubject = (e) => {
    setSubject(e.target.value);
  };
  const initCourseName = (e) => {
    const value = e.target.value;
    setCourseName(value);
  };

  // 將學生加進課程的請求，在createdCourseId改變時會執行
  const addStudentIntoNewCourse = () => {
    const alert = document.querySelector(".alert");
    // 如果有選擇學生
    if (selectedStudentId.length && createdCourseId) {
      // 批量成員加進指定課程
      adminService
        .registerMember(token, {
          user_ids: selectedStudentId,
          course_id: createdCourseId,
        })
        .then((res) => {
          console.log(res);
          // 除錯
          console.error(res.data);
          alert.style.backgroundColor = "#a0db6c";
        });
    }
  };
  // 新增按鈕
  const requireCreateCourse = () => {
    // 參數
    courseInfo = {
      grade: grade.trim(),
      subject: subject.trim(),
      courseClass: courseClass.trim(),
      courseName: courseName.trim(),
    };
    const alert = document.querySelector(".alert");
    // 請求
    try {
      // 創建新課程
      adminService.createANewCourse(token, courseInfo).then((res) => {
        // 檢查是否回傳res.success
        if (res.success === false) {
          alert.style.backgroundColor = "red";
          setMessage(`課程創建失敗!${res.msg}`);
        } else if (res.courseName) {
          alert.style.backgroundColor = "#a0db6c";
          setMessage(`課程創建成功!`);
          console.log(res._id);
          setCreatedCourseId(res._id);
        }
      });
    } catch (error) {
      // 紅色警告
      alert.style.backgroundColor = "red";
      setMessage(`發生不明錯誤!${error}`);
    }
    // 開關警告
    alert.style.opacity = "1";
    alert.style.height = "60px";
    setTimeout(() => {
      alert.style.opacity = "0";
      alert.style.height = "0";
    }, 2000);
    // 清空輸入欄位
    setGrade("");
    setCourseClass("");
    setSubject("");
    setCourseName("");
  };

  return (
    <div className="register-course-container">
      <div className="register-page-header">創建課程系統</div>
      <div className="alert">{message}</div>
      <div className="btns">
        <button
          className="clear-form-btn"
          onClick={() => {
            setGrade("");
            setCourseClass("");
            setSubject("");
            setCourseName("");
          }}
        >
          清除欄位
        </button>
        <button className="submit-form-btn" onClick={requireCreateCourse}>
          創建課程
        </button>
      </div>
      <div className="form">
        <div className="form-inputs">
          <div className="form-input-area">
            <div className="form-input-title">年級:</div>
            <input
              onChange={initGrade}
              className="form-input"
              id="grade"
              type="text"
              value={grade}
            />
            <div className="hint">例如:學年度</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">科目:</div>
            <input
              onChange={initCourseClass}
              className="form-input"
              id="subject"
              type="text"
              value={courseClass}
            />
            <div className="hint">例如:化學、物理</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">班級:</div>
            <input
              onChange={initSubject}
              className="form-input"
              id="courseClass"
              type="text"
              value={subject}
            />
            <div className="hint">例如:甲班，A班</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">課程名稱:</div>
            <input
              onChange={initCourseName}
              className="form-input"
              id="courseName"
              type="text"
              value={courseName}
            />
            <div className="hint">此處會自動生成最終名稱</div>
          </div>
        </div>
      </div>
      <div className="gray-hint">可從底部選擇學生直接加入創建的新課程</div>
      <div className="child-component">
        <MenberSelector
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
        ></MenberSelector>
      </div>
    </div>
  );
}
