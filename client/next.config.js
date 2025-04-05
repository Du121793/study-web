/** @type {import('next').NextConfig} */
const serverUrl = new URL(process.env.NEXT_PUBLIC_SERVER_IP); // "http://35.212.172.120:8080"
const clientUrl = new URL(process.env.NEXT_PUBLIC_CLIENT_IP); // "http://35.212.172.120:3000"

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // 允許來自環境變數指定的伺服器 (例如: http://35.212.172.120:8080/resource/**)
      {
        protocol: serverUrl.protocol.replace(":", ""), // 會變成 "http"
        hostname: serverUrl.hostname, // "35.212.172.120"
        port: serverUrl.port, // "8080"
        pathname: "/resource/**",
      },
      // 允許來自 profile.line-scdn.net（假設使用 HTTPS）
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
        pathname: "/**",
      },
      // 允許來自 client (例如: http://35.212.172.120:3000 或 localhost)
      {
        protocol: clientUrl.protocol.replace(":", ""), // 例如 "http"
        hostname: clientUrl.hostname, // 例如 "35.212.172.120" 或 "localhost"
        port: clientUrl.port, // 例如 "3000"
        pathname: "/**",
      },
      {
        protocol: "http",  // localhost 一般使用 HTTP
        hostname: "localhost",
        port: "8080",      // 請將 port 改為字串
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
