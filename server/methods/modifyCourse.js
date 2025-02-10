const fs = require("fs");
const filePath = __dirname + "/grades.json";

// 讀取 JSON 文件
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading file:", err);
    // 如果檔案不存在，回傳空結構
    return { grades: {} };
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

/**
 * 新增年級 -> 科目 -> 班級
 * 這裡三者都以物件的方式存放
 *
 * grades: {
 *   [grade]: {
 *     [subject]: {
 *       [courseClass]: {}
 *     }
 *   }
 * }
 */
function addSubject(grade, subject, courseClass) {
  const data = readJsonFile(filePath);

  // 確認 grade 是否存在，不存在就建立空物件
  if (!data.grades[grade]) {
    data.grades[grade] = {};
    console.log(`Added new grade: ${grade}`);
  }

  // 確認 subject 是否存在，不存在就建立空物件
  if (!data.grades[grade][subject]) {
    data.grades[grade][subject] = {};
    console.log(`Added new subject: ${subject} to grade: ${grade}`);
  }

  // 確認班級是否存在，不存在就建立空物件
  if (!data.grades[grade][subject][courseClass]) {
    data.grades[grade][subject][courseClass] = {};
    console.log(
      `Added new class: ${courseClass} to subject: ${subject} (grade: ${grade})`
    );
  } else {
    console.log(
      `Class: ${courseClass} already exists in subject: ${subject}, grade: ${grade}.`
    );
  }

  writeJsonFile(filePath, data);
}

/**
 * 刪除年級 -> 科目 -> 班級
 * 會先刪除指定班級，若科目底下無班級則刪科目；若年級底下無科目則刪年級
 */
function deleteSubject(grade, subject, courseClass) {
  const data = readJsonFile(filePath);

  if (!data.grades[grade]) {
    console.log(`Grade: ${grade} does not exist.`);
    return;
  }
  if (!data.grades[grade][subject]) {
    console.log(`Subject: ${subject} does not exist in grade: ${grade}.`);
    return;
  }
  if (!data.grades[grade][subject][courseClass]) {
    console.log(
      `Class: ${courseClass} does not exist in subject: ${subject}, grade: ${grade}.`
    );
    return;
  }

  // 刪除指定班級
  delete data.grades[grade][subject][courseClass];
  console.log(
    `Deleted class: ${courseClass} from subject: ${subject} (grade: ${grade})`
  );

  // 如果該 subject 底下已沒有任何班級，刪掉 subject
  if (Object.keys(data.grades[grade][subject]).length === 0) {
    delete data.grades[grade][subject];
    console.log(
      `Deleted subject: ${subject} from grade: ${grade}, because no classes left.`
    );
  }

  // 如果該 grade 底下已沒有任何 subject，刪掉 grade
  if (Object.keys(data.grades[grade]).length === 0) {
    delete data.grades[grade];
    console.log(`Deleted grade: ${grade}, because no subjects left.`);
  }

  writeJsonFile(filePath, data);
}

/**
 * findSubject(grade, subject)
 * 不提供參數 -> 返回所有年級 (string[]),
 * 只提供 grade -> 返回該年級所有科目 (string[]),
 * 同時提供 grade & subject -> 返回該科目底下所有班級 (string[]),
 */
function findSubject(grade, subject) {
  const data = readJsonFile(filePath);

  // 1) 不帶任何參數 => 回傳所有年級
  if (!grade) {
    return Object.keys(data.grades);
  }

  // 2) 只帶 grade => 回傳該年級所有科目
  const gradeObj = data.grades[grade];
  if (!gradeObj) {
    console.log(`Grade "${grade}" not found.`);
    return [];
  }
  if (!subject) {
    return Object.keys(gradeObj);
  }

  // 3) 同時帶 grade & subject => 回傳所有班級
  const subjectObj = gradeObj[subject];
  if (!subjectObj) {
    console.log(`Subject "${subject}" not found in grade "${grade}".`);
    return [];
  }
  return Object.keys(subjectObj);
}

module.exports = {
  addSubject,
  deleteSubject,
  findSubject,
};
