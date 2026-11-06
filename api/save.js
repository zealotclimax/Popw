import { put } from "@vercel/blob";
import { authed, clean, body } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!authed(req)) return res.status(401).json({ error: "密码不正确" });
  let json;
  try {
    json = JSON.stringify(clean(JSON.parse((await body(req)).toString())));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    const o = { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" };
    await put("data.json", json, o);
    await put("backups/" + Date.now() + ".json", json, o); // 每次发布自动留一份历史备份
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "保存失败，请检查 Blob 是否已连接" });
  }
}
