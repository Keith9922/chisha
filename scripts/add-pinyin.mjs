// 给 foods.json 每条食物加上 pinyin 字段（全拼 + 首字母）
// 用法: node scripts/add-pinyin.mjs
import { readFileSync, writeFileSync } from "fs";
import { pinyin } from "pinyin-pro";

const path = new URL("../data/foods.json", import.meta.url);
const db = JSON.parse(readFileSync(path, "utf-8"));

let n = 0;
for (const item of db.items) {
  const text = `${item.brand ?? ""}${item.name}`;
  const full = pinyin(text, { toneType: "none", type: "string", v: true }).replace(/\s+/g, "").toLowerCase();
  const initials = pinyin(text, { pattern: "first", type: "string", toneType: "none" }).replace(/\s+/g, "").toLowerCase();
  item.pinyin = full;
  item.pinyin_initials = initials;
  n++;
}
db.updated = new Date().toISOString().slice(0, 10);
writeFileSync(path, JSON.stringify(db, null, 2));
console.log(`Added pinyin to ${n} items.`);
console.log("Sample:", db.items.slice(0, 3).map((i) => ({
  name: `${i.brand ?? ""}${i.name}`,
  pinyin: i.pinyin,
  initials: i.pinyin_initials,
})));
