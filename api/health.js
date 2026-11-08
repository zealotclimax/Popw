import { list } from "@vercel/blob";
import { authed } from "../lib/store.js";

// 自检接口：打开 /api/health 可以直接看到配置是否正常。
// 公开只返回“有/无”，登录管理页后才会返回具体报错原因。
export default async function handler(req, res) {
  const out = {
    adminPassword: !!process.env.ADMIN_PASSWORD,
    blobStoreId: !!process.env.BLOB_STORE_ID,
    blobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    blob: "unknown",
  };
  try {
    await list({ limit: 1 });
    out.blob = "ok";
  } catch (e) {
    out.blob = "error";
    if (authed(req)) out.detail = String((e && e.message) || e);
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(out);
}
