const router = require("express").Router();
const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv");

const carouselPath = path.join(__dirname, "carousel");
const boardPath = path.join(__dirname, "board");

router.use("/carousel", express.static(carouselPath));
router.use("/board", express.static(boardPath));

module.exports = router;
