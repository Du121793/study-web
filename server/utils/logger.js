/**
 * @file logger.js
 * @description 統一的日誌記錄系統
 * @author StudyWeb Team
 * @date 2024-03-30
 */

/**
 * 格式化日誌訊息
 * @param {Object} options - 日誌選項
 * @param {string} [options.userName] - 用戶真實姓名
 * @param {string} [options.userId] - 用戶ID
 * @param {string} [options.userIp] - 用戶IP
 * @param {string} action - 用戶執行的操作
 * @returns {string} 格式化後的日誌訊息
 */
const formatLogMessage = ({ userName, userId, userIp }, action) => {
  const parts = [];

  // 添加用戶姓名（如果沒有則顯示"系統"）
  parts.push(`[${userName || "系統"}]`);

  // 添加用戶ID（如果有）
  if (userId) {
    parts.push(`[id:${userId}]`);
  }

  // 添加用戶IP（如果有）
  if (userIp) {
    parts.push(`[${userIp}]`);
  }

  // 添加操作描述
  parts.push(action);

  return parts.join(" ");
};

/**
 * 記錄正常日誌
 * @param {Object} options - 日誌選項
 * @param {string} [options.userName] - 用戶真實姓名
 * @param {string} [options.userId] - 用戶ID
 * @param {string} [options.userIp] - 用戶IP
 * @param {string} action - 用戶執行的操作
 */
const log = (options, action) => {
  const message = formatLogMessage(options, action);
  console.log(message);
};

/**
 * 記錄錯誤日誌
 * @param {Object} options - 日誌選項
 * @param {string} [options.userName] - 用戶真實姓名
 * @param {string} [options.userId] - 用戶ID
 * @param {string} [options.userIp] - 用戶IP
 * @param {string} file - 發生錯誤的文件
 * @param {string} route - 發生錯誤的路由
 * @param {Object} input - 用戶輸入的參數
 * @param {Error} error - 錯誤對象
 */
const logError = (options, file, route, input, error) => {
  const baseMessage = formatLogMessage(options, `${file}(${route})`);
  const inputStr = JSON.stringify(input);
  console.error(`${baseMessage} 用戶傳入值:${inputStr} 錯誤:`, error);
};

module.exports = {
  log,
  logError,
};
