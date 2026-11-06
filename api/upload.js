import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { authed, body } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!authed(req)) return res.status(401).json({ error: "密码不正确" });
  const buf = await body(req);
  if (!buf.length || buf.length > 4 * 1024 * 1024) return res.status(413).json({ error: "图片为空或超过 4MB" });
  try {
    const b = await put("img/" + randomUUID() + ".jpg", buf, { access: "public", contentType: "image/jpeg" });
    res.status(200).json({ url: b.url });
  } catch (e) {
    res.status(500).json({ error: "上传失败，请检查 Blob 是否已连接" });
  }
}
