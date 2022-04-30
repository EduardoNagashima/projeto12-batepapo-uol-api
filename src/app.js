import express from "express";

const app = express();

app.get('/teste', (req,res)=>{


    res.send("Está funcionando!");
})

app.listen(5000);