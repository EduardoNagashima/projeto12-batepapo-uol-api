import express from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import joi from "joi";

const app = express();
app.use(express.json());
app.use(cors());

const participantSchema = joi.object({
    name: joi.string().required()
});

let db;
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");
mongoClient.connect().then(()=>{
    db = mongoClient.db("projeto12")
})

app.post('/participants', (req,res)=>{
    const {name} = req.body;
    
    const validation = participantSchema.validate(req.body);

    if (validation.error){
        console.log(validation.error.details);
        res.status(422).send('Erro ao cadastrar');
        return;
    }

    db.collection("participants").insertOne({"name": name});

    res.sendStatus(201);
})

app.listen(5000);