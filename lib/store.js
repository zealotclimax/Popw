import { list } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

// 数据结构版本。以后改字段时：把 CURRENT 加 1，并在 migrate() 里补一段升级代码。
export const CURRENT = 1;

export const EMPTY = {
  v: CURRENT,
  contact: "微信：your_wechat_id（备注“泡泡马特”）",
  items: [],
};

// 读到旧版本数据时，在这里逐级升级，商品数据不会丢。
export function migrate(d) {
  d.v = d.v || 1;
  // if (d.v < 2) { d.items.forEach(i => { i.newField = ""; }); d.v = 2; }
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
  return {
    v: CURRENT,
    contact: s(d.contact, 200),
    items: d.items.map((i, k) => ({
      id: Number.isInteger(i.id) ? i.id : k + 1,
      name: s(i.name, 80),
      series: s(i.series, 40),
      cond: s(i.cond, 20),
      price: Math.max(0, Number(i.price) || 0),
      box: s(i.box, 60),
      note: s(i.note, 300),
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
