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

app.get("/",(req,res)=>{
    res.send(`
    <h2>Ban Panel</h2>
    <button onclick="window.location='/bans'">Ver Banidos</button>
    <button onclick="window.location='/clear'">Clear All</button>
    `);
});

app.get("/bans",(req,res)=>{
    let html = "<h2>Lista de Banidos</h2><a href='/'>Voltar</a><br><br>";

    bans.forEach((b,i)=>{
        html += `
        <div style="border:1px solid #ccc;padding:10px;margin:5px">
            <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${b.userId}&width=60&height=60&format=png">
            <br>
            <b>${b.username}</b><br>
            UserId: ${b.userId}<br>
            IP: ${b.ip}<br>
            <a href="/unban/${i}">Unban</a>
        </div>
        `;
    });

    res.send(html);
});

app.get("/unban/:id",(req,res)=>{
    const id = parseInt(req.params.id);
    bans.splice(id,1);
    save();
    res.redirect("/bans");
});

app.get("/clear",(req,res)=>{
    bans = [];
    save();
    res.redirect("/");
});

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

app.listen(3000);
