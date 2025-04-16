// customImageLoader.js
export default function customImageLoader({ src, width, quality }) {
  let url;
  try {
    // 如果 src 為相對路徑，補上預設 base URL (請根據實際情況修改)
    url = new URL(src, "https://www.du1217.club");
  } catch (error) {
    throw new Error(`Invalid src passed to image loader: ${src}`);
  }

  // 強制使用 HTTPS 協議
  url.protocol = 'https:';

  // 如果路徑中沒有常見圖片副檔名，預設補上 .jpg
  if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname)) {
    url.pathname = url.pathname.endsWith('/')
      ? url.pathname + 'index.jpg'
      : url.pathname + '.jpg';
  }

  // 加上寬度與品質參數
  url.searchParams.set('w', width);
  url.searchParams.set('q', quality || 75);
  
  return url.toString();
}
