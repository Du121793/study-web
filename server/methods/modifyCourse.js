const fs = require("fs");
const filePath = __dirname + "/grades.json";

// 讀取 JSON 文件
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading file:", err);
    return { grades: {} }; // 如果文件不存在，回傳空結構
  }
}

// 寫入 JSON 文件
function writeJsonFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
    console.log("File updated successfully.");
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

// 新增科目
function addSubject(grade, subject) {
  const data = readJsonFile(filePath);

  // 檢查年級是否存在
  if (!data.grades[grade]) {
    // 年級不存在，新增年級並加入科目
    data.grades[grade] = [subject];
    console.log(`Added new grade: ${grade} with subject: ${subject}`);
  } else if (!data.grades[grade].includes(subject)) {
    // 年級存在，但科目不存在，新增科目
    data.grades[grade].push(subject);
    console.log(`Added new subject: ${subject} to grade: ${grade}`);
  } else {
    // 年級和科目都存在，不做任何動作
    console.log(`Grade: ${grade} already has subject: ${subject}`);
  }

  // 寫回檔案
  writeJsonFile(filePath, data);
}

// 刪除科目
function deleteSubject(grade, subject) {
  const data = readJsonFile(filePath);

  // 檢查年級是否存在
  if (!data.grades[grade]) {
    console.log(`Grade: ${grade} does not exist.`);
    return;
  }

  // 檢查科目是否存在
  const subjectIndex = data.grades[grade].indexOf(subject);
  if (subjectIndex === -1) {
    console.log(`Subject: ${subject} does not exist in grade: ${grade}.`);
    return;
  }

  // 移除科目
  data.grades[grade].splice(subjectIndex, 1);
  console.log(`Deleted subject: ${subject} from grade: ${grade}`);

  // 如果該年級的科目陣列空了，可以選擇是否刪除該年級（這裡不刪除）
  if (data.grades[grade].length === 0) {
    delete data.grades[grade];
    console.log(`Deleted grade: ${grade} as it has no subjects.`);
  }

  // 寫回檔案
  writeJsonFile(filePath, data);
}

// 回傳科目
function findSubject(grade) {
  const data = readJsonFile(filePath);

  // 檢查該年級是否存在
  if (data.grades[grade]) {
    return data.grades[grade]; // 返回該年級的科目陣列
  } else {
    console.log(`Grade "${grade}" not found.`);
    return null; // 或者返回空陣列 []
  }
}

module.exports.addSubject = addSubject;
module.exports.deleteSubject = deleteSubject;
module.exports.findSubject = findSubject;
