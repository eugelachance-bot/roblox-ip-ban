const express = require("express");
const fs = require("fs");

const app = express();
const FILE = "bans.json";

let banned = new Set();

if (fs.existsSync(FILE)) {
    const data = JSON.parse(fs.readFileSync(FILE));
    banned = new Set(data);
}

function save() {
    fs.writeFileSync(FILE, JSON.stringify([...banned]));
}

function getIP(req){
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    
    if (ip.includes(",")) {
        ip = ip.split(",")[0];
    }

    if (ip.includes("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    return ip.trim();
}

app.get("/check", (req,res)=>{
    const ip = getIP(req);
    res.json({ banned: banned.has(ip), ip: ip });
});

app.get("/ban", (req,res)=>{
    const ip = getIP(req);
    banned.add(ip);
    save();
    res.send("banned " + ip);
});

app.listen(3000);
