import express from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import joi from "joi";
import dayjs from 'dayjs';
import dotenv from "dotenv";

dotenv.config();


        // {from: 'João', 
        // to: 'Todos', 
        // text: 'oi galera', 
        // type: 'message', 
        // time: '20:04:37'}


        // {name: 'João', 
        // lastStatus: 12313123}



const app = express();
app.use(express.json());
app.use(cors());

const participantSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message","private_message")
});

let db;

const mongoClient = new MongoClient(process.env.MONGO_URI);
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
        res.status(409).send('Usuário já cadastrado!');
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

    } catch (e) {
        console.log('Erro ao cadastrar nome');
        res.sendStatus(500);
    }

    res.sendStatus(201);
});

app.get('/participants', async (req, res)=>{

    try{
        const participants = await db.collection("participants").find({}).toArray();
        res.send(participants);
        return;
    }catch(e){
        console.log(e);
    }
    res.sendStatus(200);
});

app.post('/messages', async (req, res)=>{
    try{
        const msg = req.body;
        const {user} = req.headers;
        const validation = messageSchema.validate(msg);
        const findSender = await db.collection("participants").findOne({name: user});
    
        if (validation.error || !findSender){
            res.sendStatus(422);
            return;
        }

        await db.collection("messages").insertOne({
            from: user,
            to: req.body.to,
            text: req.body.text,
            type: req.body.type,
            time: `${dayjs().format('HH:mm:ss')}`
        })

       res.sendStatus(201);
    }catch(e){
        console.log(e);
    }
})

app.get('/messages', async (req, res)=>{

    try{
        const {user} = req.headers;
        const allMessages = await db.collection("messages").find({}).toArray();
        console.log(allMessages);
        res.send(allMessages);
        return;
    } catch(e){
        console.log(e);
        res.sendStatus(500);
    }
    res.sendStatus(200)
})

app.post('/status', async (req, res)=>{
    try{
        const {user} = req.headers;
        const findSender = await db.collection("participants").findOne({name: user});
    
        if (!findSender){
            res.sendStatus(404);
            return;
        }

        await db.collection("participants").updateOne({ 
			findSender: user 
		}, { $set: {time: `${dayjs().format('HH:mm:ss')}`} })

    }catch(e){
        console.log(e);
    }
    
    res.sendStatus(200);
})

app.listen(5000);