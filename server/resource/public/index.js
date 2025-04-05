/**
 * @file index.js
 * @description 公開資源路由配置，處理輪播圖和公告板等公開靜態資源的存取
 * @author StudyWeb Team
 * @date 2024-03-30
 */

const router = require("express").Router();
const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv");

// 設定靜態資源路徑
const carouselPath = path.join(__dirname, "carousel");
const boardPath = path.join(__dirname, "board");

// 設定靜態資源路由
/**
 * 輪播圖資源路由
 * @description 處理輪播圖相關的靜態資源存取
 */
router.use("/carousel", express.static(carouselPath));

/**
 * 公告板資源路由
 * @description 處理公告板相關的靜態資源存取
 */
router.use("/board", express.static(boardPath));

module.exports = router;
