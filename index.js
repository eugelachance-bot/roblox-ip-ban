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

app.get("/bans",(req,res)=>{
    const search = req.query.search?.toLowerCase() || "";

    let html = `
    <h2>Lista de Banidos</h2>
    <a href="/">Voltar</a><br><br>

    <form method="GET" action="/bans">
        <input name="search" placeholder="Filtrar por nickname">
        <button type="submit">Buscar</button>
    </form>
    <br>
    `;

    bans
    .filter(b => b.username?.toLowerCase().includes(search))
    .forEach((b,i)=>{
        html += `
        <div style="border:1px solid #ccc;padding:10px;margin:5px">
            <img id="avatar-${i}" width="60" height="60">
            <br>
            <b>${b.username}</b><br>
            UserId: ${b.userId}<br>
            IP: ${b.ip}<br>
            <a href="/unban/${i}">Unban</a>
        </div>

        <script>
        fetch("https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${b.userId}&size=60x60&format=Png&isCircular=false")
        .then(r=>r.json())
        .then(data=>{
            document.getElementById("avatar-${i}").src = data.data[0].imageUrl
        })
        </script>
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
