const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const who = await admin.auth().verifyIdToken(token);
    const { listId, title, body, cat } = req.body || {};
    if (!listId || !body) return res.status(400).json({ error: "dados faltando" });

    const snap = await admin.firestore().doc(`lists/${listId}`).get();
    if (!snap.exists) return res.status(404).json({ error: "lista não existe" });
    const list = snap.data();
    if (!list.members.includes(who.uid)) return res.status(403).json({ error: "sem acesso" });

    const recipients = list.members.filter(uid => uid !== who.uid).filter(uid => {
      const acc = list.access && list.access[uid];
      if (!Array.isArray(acc) || !cat) return true;
      return acc.includes(cat);
    });

    const tokens = [];
    for (const uid of recipients) {
      const t = await admin.firestore().doc(`tokens/${uid}`).get();
      ((t.data() || {}).tokens || []).forEach(x => tokens.push(x));
    }
    if (!tokens.length) return res.status(200).json({ sent: 0 });

    const result = await admin.messaging().sendEachForMulticast({
      tokens: [...new Set(tokens)],
      notification: { title: title || "Marcas boas e ruins", body },
      webpush: { fcmOptions: { link: "/" } }
    });
    return res.status(200).json({ sent: result.successCount });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
