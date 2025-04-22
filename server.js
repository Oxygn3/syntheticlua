const express = require("express");
const fs = require("fs");
const axios = require("axios");
const app = express();
const port = 3000;

const webhookURL = "https://discord.com/api/webhooks/YOURLINKHERE"; // Replace this 🔗

app.use(express.json());
app.use(express.static("public"));

function logToDiscord(msg) {
    axios.post(webhookURL, {
        content: msg
    }).catch(err => console.error("Webhook failed:", err));
}

app.get("/checkkey", (req, res) => {
    const key = req.query.key;
    const db = JSON.parse(fs.readFileSync("keys.json"));

    if (db[key]) {
        const expiry = db[key].expiry;
        const now = Math.floor(Date.now() / 1000);
        const status = expiry >= now ? "✅ Success" : "❌ Expired";
        logToDiscord(`🔐 **Login Attempt**\nKey: \`${key}\`\nUser: \`${db[key].user}\`\nResult: ${status}`);
        if (expiry >= now) return res.json({ success: true, expiry });
        return res.json({ success: false, reason: "expired" });
    }

    logToDiscord(`🚫 **Invalid Key Attempt**\nKey: \`${key}\``);
    res.json({ success: false, reason: "invalid" });
});

app.post("/addkey", (req, res) => {
    const { key, expiry, user } = req.body;
    const db = JSON.parse(fs.readFileSync("keys.json"));
    db[key] = { expiry, user: user || "unknown" };
    fs.writeFileSync("keys.json", JSON.stringify(db, null, 2));
    res.send("✅ Key added.");
    logToDiscord(`🆕 **Key Added**\nKey: \`${key}\`\nUser: \`${user}\`\nExpiry: <t:${expiry}:R>`);
});

app.post("/removekey", (req, res) => {
    const { key } = req.body;
    const db = JSON.parse(fs.readFileSync("keys.json"));
    if (db[key]) {
        logToDiscord(`❌ **Key Removed**\nKey: \`${key}\`\nUser: \`${db[key].user}\``);
        delete db[key];
        fs.writeFileSync("keys.json", JSON.stringify(db, null, 2));
        res.send("❌ Key removed.");
    } else {
        res.send("❗ Key not found.");
    }
});

app.listen(port, () => console.log(`🌐 Panel running at http://localhost:${port}`));
