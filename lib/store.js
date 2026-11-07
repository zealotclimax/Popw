import { list } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

// 数据结构版本。以后改字段时：把 CURRENT 加 1，并在 migrate() 里补一段升级代码。
export const CURRENT = 2;

// 联系方式的类型。以后要增加新类型（比如 Facebook），在这里加一个名字，
// 再到 public/index.html 的 CT 列表里加一行即可，管理页会自动出现新的输入框。
export const CONTACT_KEYS = ["wechat", "phone", "instagram", "email", "whatsapp"];

export const EMPTY = {
  v: CURRENT,
  contacts: { wechat: "johnny_jai_fu" },
  siteName: { en: "", zh: "" }, // 留空表示使用页面里的默认名称
  items: [],
};

// 读到旧版本数据时，在这里逐级升级，商品数据不会丢。
export function migrate(d) {
  d.v = d.v || 1;
  if (d.v < 2) {
    d.contacts = d.contacts || { wechat: "johnny_jai_fu" };
    d.v = 2;
  }
  return d;
}

export function authed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(String(req.headers["x-admin-password"] || ""));
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readData() {
  const { blobs } = await list({ prefix: "data.json" });
  if (!blobs.length) return EMPTY;
  const r = await fetch(blobs[0].url + "?t=" + Date.now());
  return migrate(await r.json());
}

// 保存前清洗并限制长度，避免脏数据进入存储。
export function clean(d) {
  const s = (v, n) => String(v ?? "").slice(0, n);
  if (!d || !Array.isArray(d.items) || d.items.length > 500) throw new Error("数据格式错误");
  const contacts = {};
  for (const k of CONTACT_KEYS) contacts[k] = s(d.contacts && d.contacts[k], 100).trim();
  return {
    v: CURRENT,
    contacts,
    siteName: {
      en: s(d.siteName && d.siteName.en, 40).trim(),
      zh: s(d.siteName && d.siteName.zh, 40).trim(),
    },
    items: d.items.map((i, k) => ({
      id: Number.isInteger(i.id) ? i.id : k + 1,
      name: s(i.name, 80),
      nameEn: s(i.nameEn, 80),
      series: s(i.series, 40),
      cond: s(i.cond, 20),
      price: Math.max(0, Number(i.price) || 0),
      box: s(i.box, 60),
      boxEn: s(i.boxEn, 60),
      note: s(i.note, 300),
      noteEn: s(i.noteEn, 300),
      sold: !!i.sold,
      imgs: (Array.isArray(i.imgs) ? i.imgs : [])
        .filter((u) => typeof u === "string" && u.startsWith("https://"))
        .slice(0, 12),
    })),
  };
}

export async function body(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body && typeof req.body === "object") return Buffer.from(JSON.stringify(req.body));
  const c = [];
  for await (const x of req) c.push(x);
  return Buffer.concat(c);
}
