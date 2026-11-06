import { authed } from "../lib/store.js";

export default function handler(req, res) {
  if (authed(req)) res.status(200).json({ ok: true });
  else res.status(401).json({ error: "密码不正确" });
}
