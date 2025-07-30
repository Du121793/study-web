/**
 * @file backup.js
 * @description 備份與還原工具
 *
 * [指令列用法]
 *   備份：
 *     node utils/backup.js backup --mongoUri=mongodb://localhost:27017/StudyWebDBAlpha
 *     npm run backup -- --mongoUri=mongodb://localhost:27017/StudyWebDBAlpha
 *   還原：
 *     node utils/backup.js restore --backupFile=backup/xxx.zip --mode=full|partial|add --mongoUri=xxx
 *     npm run restore -- --backupFile=backup/xxx.zip --mode=full|partial|add --mongoUri=xxx
 *
 * [程式內部用法]
 *   const { backup, restore } = require('./backup');
 *   await backup({ mongoUri: 'mongodb://localhost:27017/StudyWebDBAlpha' });
 *   await restore({ backupFile: 'backup/xxx.zip', mode: 'add', mongoUri: 'mongodb://localhost:27017/StudyWebDBAlpha' });
 *
 * [還原模式說明]
 *   full: 完全覆蓋（不存在備份檔的檔案全部刪除）
 *   partial: 部分覆蓋（不存在備份檔的檔案保留，同名檔案覆蓋）
 *   add: 只添加（只將備份檔有的檔案加入，同名不處理，預設）
 *
 * @author StudyWeb Team
 * @date 2024-06-09
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const logger = require("./logger");
const archiver = require("archiver");
const glob = require("glob");
const AdmZip = require("adm-zip");

/**
 * 備份 resource 目錄與 MongoDB 資料，壓縮成 zip 檔
 */
async function backup(options = {}) {
  const resourceDir = options.resourceDir || "resource";
  const backupDir = options.backupDir || "backup";
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const zipName = `backup_${dateStr}.zip`;
  const zipPath = path.join(backupDir, zipName);
  const mongoUri = (options.mongoUri || process.env.DB_IP || "").trim();
  const mongoDumpDir = path.join(backupDir, `mongo_dump_${dateStr}`);

  logger.log({ userName: "系統" }, `DEBUG: mongoUri = "${mongoUri}"`);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const files = glob.sync("**/*", {
    cwd: resourceDir,
    nodir: true,
    ignore: ["**/*.js"],
  });
  logger.log({ userName: "系統" }, `開始壓縮 ${files.length} 個檔案...`);

  if (mongoUri) {
    logger.log({ userName: "系統" }, "開始匯出 MongoDB...");
    await new Promise((res, rej) => {
      const cmd = `mongodump --uri="${mongoUri}" --out="${mongoDumpDir}"`;
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          logger.logError(
            { userName: "系統" },
            "backup.js",
            "mongodump",
            { mongoUri },
            err
          );
          rej(err);
        } else {
          logger.log({ userName: "系統" }, "MongoDB 匯出完成");
          res();
        }
      });
    });
  } else {
    logger.logError(
      { userName: "系統" },
      "backup.js",
      "backup",
      options,
      new Error("未提供 mongoUri，略過 MongoDB 匯出")
    );
  }

  await new Promise((res, rej) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", res);
    archive.on("error", (err) => rej(err));
    archive.pipe(output);
    files.forEach((file) =>
      archive.file(path.join(resourceDir, file), {
        name: path.join("resource", file),
      })
    );
    if (fs.existsSync(mongoDumpDir))
      archive.directory(mongoDumpDir, "mongo_dump");
    archive.finalize();
  });

  if (fs.existsSync(mongoDumpDir))
    fs.rmSync(mongoDumpDir, { recursive: true, force: true });
  logger.log({ userName: "系統" }, `檔案壓縮完成，儲存於 ${zipPath}`);
  return zipPath;
}

/**
 * 還原備份，包括 resource 與 MongoDB
 */
async function restore(options = {}) {
  const backupFile = options.backupFile;
  const mode = options.mode || "add";
  const resourceDir = options.resourceDir || "resource";
  const mongoUri = (options.mongoUri || process.env.DB_IP || "").trim();
  const tmpDir = path.join("backup", "__restore_tmp");

  if (!backupFile || !fs.existsSync(backupFile)) {
    logger.logError(
      { userName: "系統" },
      "backup.js",
      "restore",
      options,
      new Error("備份檔案不存在")
    );
    return;
  }
  if (fs.existsSync(tmpDir))
    fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir);
  new AdmZip(backupFile).extractAllTo(tmpDir, true);

  // 還原 resource 檔案
  const srcRes = path.join(tmpDir, "resource");
  if (fs.existsSync(srcRes)) {
    if (mode === "full" && fs.existsSync(resourceDir)) {
      (function del(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) {
            del(p);
            if (fs.existsSync(p) && fs.readdirSync(p).length === 0)
              fs.rmdirSync(p);
          } else if (!e.name.endsWith(".js")) fs.unlinkSync(p);
        });
      })(resourceDir);
    }
    const copy = (s, d, ov) => {
      if (!fs.existsSync(path.dirname(d)))
        fs.mkdirSync(path.dirname(d), { recursive: true });
      if (ov || !fs.existsSync(d)) fs.copyFileSync(s, d);
    };
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        const p = path.join(dir, e.name),
          r = path.relative(srcRes, p),
          d = path.join(resourceDir, r);
        e.isDirectory() ? walk(p) : copy(p, d, mode !== "add");
      });
    })(srcRes);
  }

  // 還原 MongoDB
  const dumpDir = path.join(tmpDir, "mongo_dump");
  if (fs.existsSync(dumpDir) && mongoUri) {
    logger.log({ userName: "系統" }, "開始還原 MongoDB...");
    // 找出每個資料庫子目錄
    const dbDirs = fs
      .readdirSync(dumpDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(dumpDir, e.name));
    for (const dbPath of dbDirs) {
      const abs = path.resolve(dbPath).replace(/\\/g, "/");
      await new Promise((res, rej) => {
        const cmd = `mongorestore --uri="${mongoUri}" --drop --dir="${abs}"`;
        exec(cmd, (err, stdout, stderr) => {
          console.log(stdout);
          console.error(stderr);
          if (err) {
            logger.logError(
              { userName: "系統" },
              "backup.js",
              "mongorestore",
              { mongoUri },
              err
            );
            rej(err);
          } else {
            logger.log({ userName: "系統" }, `MongoDB 還原完成: ${abs}`);
            res();
          }
        });
      });
    }
  }

  if (fs.existsSync(tmpDir))
    fs.rmSync(tmpDir, { recursive: true, force: true });
  logger.log({ userName: "系統" }, `還原完成: ${backupFile}（模式: ${mode}）`);
}

if (require.main === module) {
  const argv = process.argv.slice(2),
    cmd = argv[0],
    args = {},
    last = null;
  let key;
  argv.slice(1).forEach((a) => {
    if (a.startsWith("--")) {
      const i = a.indexOf("=");
      if (i > 0) {
        key = a.slice(2, i);
        args[key] = a.slice(i + 1);
      } else {
        key = a.slice(2);
        args[key] = true;
      }
    } else if (key) {
      args[key] = a;
    }
  });
  if (cmd === "backup")
    backup(args)
      .then((f) => logger.log({ userName: "系統" }, `備份完成: ${f}`))
      .catch((e) =>
        logger.logError({ userName: "系統" }, "backup.js", "backup", args, e)
      );
  else if (cmd === "restore")
    restore(args)
      .then(() =>
        logger.log({ userName: "系統" }, `還原完成: ${args.backupFile}`)
      )
      .catch((e) =>
        logger.logError({ userName: "系統" }, "backup.js", "restore", args, e)
      );
  else
    console.log(
      "用法: node utils/backup.js backup | restore --file=xxx.zip --mode=full|partial|add"
    );
}

module.exports = { backup, restore };
