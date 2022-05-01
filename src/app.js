import express from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import joi from "joi";
import dayjs from 'dayjs';

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

app.post('/participants', async (req,res)=>{
    try{

    const {name} = req.body;
    
    const validation = participantSchema.validate(req.body);

    if (validation.error){
        console.log(validation.error.details);
        res.status(422).send('Erro ao cadastrar');
        return;
    }

    const alreadyHas = await db.collection("participants").findOne({name: {$eq: name}})

    if (alreadyHas){
        res.sendStatus(409);
        return;
    }

    await db.collection("participants").insertOne({name: name, lastStatus: Date.now()});
    
    await db.collection("messages").insertOne({
        from: name, 
        to: 'Todos', 
        text: 'entra na sala...', 
        type: 'status', 
        time: `${dayjs().format('HH:mm:ss')}`
    });

    res.sendStatus(201);

    } catch (e) {
        console.log('Erro ao cadastrar nome', e);
    }
})

//FIXME MUDAR AQUi!!!
app.listen(5100);