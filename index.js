const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const FILE = "bans.json";

let bans = [];

if (fs.existsSync(FILE)) {
    try {
        bans = JSON.parse(fs.readFileSync(FILE));
    } catch {
        bans = [];
    }
}

function save() {
    fs.writeFileSync(FILE, JSON.stringify(bans, null, 2));
}

function getIP(req) {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (ip.includes(",")) ip = ip.split(",")[0];
    if (ip.includes("::ffff:")) ip = ip.replace("::ffff:", "");
    return ip.trim();
}

function countUnique(key) {
    return new Set(bans.map(b => b[key])).size;
}

function htmlPage(title, body) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body {
    font-family: Arial;
    background: #0f0f0f;
    color: white;
    text-align: center;
}

button {
    padding: 10px 14px;
    margin: 5px;
    border: none;
    border-radius: 8px;
    background: #2c2c2c;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #444;
}

.card {
    background: #1c1c1c;
    padding: 15px;
    margin: 10px auto;
    width: 420px;
    border-radius: 10px;
    text-align: left;
}

input {
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 200px;
}
</style>
</head>
<body>
${body}
</body>
</html>
    `;
}

app.get("/", (req, res) => {
    res.send(htmlPage("Ban Panel", `
<h1>🔥 Ban Control Panel</h1>

<div class="card">
<p>IP bans: ${countUnique("ip")}</p>
<p>HWID bans: ${countUnique("hwid")}</p>
<p>Fingerprint bans: ${countUnique("fingerprint")}</p>
</div>

<button onclick="location.href='/bans'">Ver Banidos</button>
<button onclick="location.href='/clear'">Clear All</button>
    `));
});

app.get("/bans", (req, res) => {
    const search = req.query.search?.toLowerCase() || "";

    let body = `
<h1>🚫 Lista de Banidos</h1>

<form method="GET" action="/bans">
<input name="search" placeholder="Buscar username">
<button type="submit">Buscar</button>
</form>

<br>
<button onclick="location.href='/'">⬅ Voltar</button>

<br><br>
`;

    const filtered = bans.filter(b =>
        b.username?.toLowerCase().includes(search)
    );

    filtered.forEach((b, i) => {
        body += `
<div class="card">
<b>👤 ${b.username}</b><br>
🆔 UserId: ${b.userId}<br>
🌐 IP: ${b.ip}<br>
<a href="/unban/${i}">Unban</a>
</div>
`;
    });

    res.send(htmlPage("Banned Users", body));
});

app.get("/unban/:id", (req, res) => {
    const id = parseInt(req.params.id);
    bans.splice(id, 1);
    save();
    res.redirect("/bans");
});

app.get("/clear", (req, res) => {
    bans = [];
    save();
    res.redirect("/");
});

/* =========================
   CHECK BAN
========================= */
app.post("/check", (req, res) => {
    const ip = getIP(req);
    const { hwid, fingerprint } = req.body;

    const banned = bans.some(b =>
        b.ip === ip ||
        b.hwid === hwid ||
        b.fingerprint === fingerprint
    );

    res.json({ banned });
});

/* =========================
   BAN PLAYER
========================= */
app.post("/ban", (req, res) => {
    const ip = getIP(req);
    const { hwid, fingerprint, userId, username } = req.body;

    bans.push({
        ip,
        hwid,
        fingerprint,
        userId,
        username,
        time: Date.now()
    });

    save();
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log("🔥 Ban system running on port 3000");
});
