/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      // 測試用：允許所有協議與域名 (僅用於測試階段，正式環境請根據需求收窄)
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      // 僅允許 www.du1217.club 的 HTTPS 圖片
      {
        protocol: 'https',
        hostname: 'www.du1217.club',
        port: '',
        pathname: '/**',
      },
      // API 路徑
      {
        protocol: 'https',
        hostname: 'www.du1217.club',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'www.du1217.club',
        port: '',
        pathname: '/api/resource/**',
      },
      {
        protocol: 'https',
        hostname: 'www.du1217.club',
        port: '',
        pathname: '/api/resource/videoIMG/**',
      },
      {
        protocol: 'https',
        hostname: 'www.du1217.club',
        port: '',
        pathname: '/api/resource/public/carousel/**',
      },
      // LINE 圖片
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
        pathname: '/**',
      },
      // 開發環境（HTTP）
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
    ],
    // 使用自訂 loader 強制 HTTPS 並補上副檔名
    // loader: 'custom',
    // loaderFile: './customImageLoader.js'
  },
}

module.exports = nextConfig