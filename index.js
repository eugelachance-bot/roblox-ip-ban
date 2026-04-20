const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const FILE = "bans.json";

let bans = {
    ip: [],
    hwid: [],
    fingerprint: []
};

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

app.post("/check",(req,res)=>{
    const ip = getIP(req);
    const { hwid, fingerprint } = req.body;

    const banned =
        bans.ip.includes(ip) ||
        bans.hwid.includes(hwid) ||
        bans.fingerprint.includes(fingerprint);

    res.json({ banned });
});

app.post("/ban",(req,res)=>{
    const ip = getIP(req);
    const { hwid, fingerprint } = req.body;

    if(!bans.ip.includes(ip)) bans.ip.push(ip);
    if(hwid && !bans.hwid.includes(hwid)) bans.hwid.push(hwid);
    if(fingerprint && !bans.fingerprint.includes(fingerprint)) bans.fingerprint.push(fingerprint);

    save();
    res.json({ success: true });
});

app.listen(3000);
