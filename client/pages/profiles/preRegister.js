import { useEffect } from "react";

export default function PreRegister() {
  let choseRole = "";
  let getAllName = [];
  let getAllPhone = [];
  let user = [];
  const submitBtnClick = () => {
    const role = document.querySelector(".chose-role").value;
    if (!role) {
      alert("請先選擇身分組");
      return;
    }

    // 選到 copy-area 下的所有 "行"
    const rowDivs = document.querySelectorAll(".copy-area > div");

    // 用來存放最終使用者輸入的「每行資料」
    let userArray = [];

    rowDivs.forEach((row) => {
      // 在每個行容器中，選出 name 與 phone
      const nameInput = row.querySelector(".name-input");
      const phoneInput = row.querySelector(".phone-input");

      // 若該行有 name/phone，就把它組成物件
      if (nameInput && phoneInput) {
        const nameValue = nameInput.value.trim();
        const phoneValue = phoneInput.value.trim();

        // 如果兩者都有輸入，才收進去 (依照需求可自行調整)
        if (nameValue !== "" || phoneValue !== "") {
          userArray.push({
            name: nameValue,
            phone: phoneValue,
            role: role,
          });
        }
      }
    });

    // 根據需求，把 userArray 傳到後端或做後續處理
    console.log("選擇的角色：", role);
    console.log("收集到的使用者資料：", userArray);
    // e.g. user = userArray;
  };

  useEffect(() => {
    const area = document.querySelector(".copy-area");

    // 事件監聽函式：只要「target 是 .phone-input」並且「目前值長度 === 1」才新增
    const handleInput = (event) => {
      if (event.target.matches(".phone-input")) {
        const inputValue = event.target.value;
        // 確認使用者剛輸入第 1 個字
        if (inputValue.length === 1) {
          area.insertAdjacentHTML(
            "beforeend",
            `
            <div>
                <div class="form-title name-title"> </div>
                <input
                class="input name-input"
                type="text"
            />
            <div class="form-title phone-title"> </div>
                <input
                class="input phone-input"
                type="text"
                />
            </div>
            `
          );
        }
      }
    };

    // 把監聽器掛在父容器 (copy-area) 上
    area.addEventListener("input", handleInput);

    // 清理函式：元件卸載時移除監聽，避免 React 18 Strict Mode 重複綁定
    return () => {
      area.removeEventListener("input", handleInput);
    };
  }, []);

  return (
    <div className="preRegister-main">
      <div className="header">
        <div className="title">預註冊系統</div>
      </div>
      <div className="form">
        <div className="form-line">
          {/* 選擇身分組 */}
          <div className="form-select">
            <div className="form-title">選擇身分組</div>
            <select className="chose-role">
              <option value="">請選擇</option>
              <option value="teacher">老師</option>
              <option value="student">學生</option>
            </select>
          </div>
          <div className="copy-area">
            {/* 初始那一行 */}
            <div>
              <div className="form-title">輸入真實姓名</div>
              <input className="input name-input" type="text" />
              <div className="form-title">輸入電話</div>
              <input className="input phone-input" type="text" />
            </div>
          </div>
        </div>
      </div>
      {/* 送出 */}
      <div className="form-submit">
        <button className="submit" onClick={submitBtnClick}>
          送出
        </button>
      </div>
    </div>
  );
}
