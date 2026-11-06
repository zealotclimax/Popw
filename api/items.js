import { readData } from "../lib/store.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    res.status(200).json(await readData());
  } catch (e) {
    res.status(500).json({ error: "读取失败" });
  }
}
