/**
 * @file vimeoHelpers.js
 * @description 提供 Vimeo API 請求封裝，並回傳 Promise；以及取得當前使用者 ID
 */
const { Vimeo } = require('@vimeo/vimeo');
require('dotenv').config();

// 初始化 Vimeo 客戶端
const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID || '',
  process.env.VIMEO_CLIENT_SECRET || '',
  process.env.VIMEO_ACCESS_TOKEN || ''
);

/**
 * 將 Vimeo API 請求包裝為 Promise
 * @param {Object} options - 請求選項
 * @returns {Promise<{data: Object, APILimit: Object}>}
 */
function vimeoRequest(options) {
  return new Promise((resolve, reject) => {
    client.request(options, (err, body, _statusCode, headers) => {
      if (err) return reject(err);
      const APILimit = {
        limit: headers['x-ratelimit-limit'],
        remaining: headers['x-ratelimit-remaining'],
        reset: headers['x-ratelimit-reset'],
      };
      resolve({ data: body, APILimit });
    });
  });
}

/**
 * 取得目前 Vimeo 使用者 ID
 * @returns {Promise<string>}
 */
async function getUserId() {
  const { data } = await vimeoRequest({ method: 'GET', path: '/me' });
  return data.uri.split('/').pop();
}

module.exports = {
  vimeoRequest,
  getUserId,
};
