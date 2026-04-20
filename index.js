const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const FILE = "bans.json";
let bans = [];

if (fs.existsSync(FILE)) {
    bans = JSON.parse(fs.readFileSync(FILE));
}

function save(){
    fs.writeFileSync(FILE, JSON.stringify(bans,null,2));
}

function getIP(req){
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if(ip.includes(",")) ip = ip.split(",")[0];
    if(ip.includes("::ffff:")) ip = ip.replace("::ffff:","");
    return ip.trim();
}

/* =========================
   CHECK (AGORA MAIS LIMPO)
========================= */

app.post("/check",(req,res)=>{
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
   BAN (SEM MUDANÇA FUNCIONAL)
========================= */

app.post("/ban",(req,res)=>{
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

/* =========================
   PANEL (INALTERADO)
========================= */

function countUnique(key){
    return new Set(bans.map(b => b[key])).size;
}

app.get("/",(req,res)=>{
    res.send(`
    <h2>Ban Panel</h2>
    <p>IP bans: ${countUnique("ip")}</p>
    <p>HWID bans: ${countUnique("hwid")}</p>
    <p>Fingerprint bans: ${countUnique("fingerprint")}</p>

    <button onclick="window.location='/bans'">Ver Banidos</button>
    <button onclick="window.location='/clear'">Clear All</button>
    `);
});

app.listen(3000);
