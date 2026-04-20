const express = require("express");
const app = express();

const banned = new Set();

function getIP(req){
    return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
}

app.get("/check", (req,res)=>{
    const ip = getIP(req);
    res.json({ banned: banned.has(ip) });
});

app.get("/ban", (req,res)=>{
    const ip = getIP(req);
    banned.add(ip);
    res.send("banned");
});

app.listen(3000);
