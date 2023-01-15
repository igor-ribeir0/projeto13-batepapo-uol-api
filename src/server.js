import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
const PORT = 5000;
const server = express();
let db;

try{
    await mongoClient.connect();
    db = mongoClient.db();
}
catch(error){
    console.log("Erro na conexão do servidor!");
}

server.use(express.json());
server.use(cors());
server.listen(PORT);

server.get('/participants', async(req, res) => {
    try{
        const gettingData = await db.collection('participants').find().toArray();

        return res.status(200).send(gettingData);
    }
    catch(error){
        return res.status(500).send(error.message);
    } 
});

server.post('/participants', async(req, res) => {
    const schema = joi.object({name: joi.string().required()});
    const userName = {name: req.body.name};
    const validation = schema.validate(userName);

    if (validation.error) {
        return res.status(422).send('Name deve ser string não vazio!');
    };

    try{
        const existingName =  await db.collection('participants').findOne({name: req.body.name});

        if(existingName) return res.status(409).send('Este nome já está sendo utilizado!');

        await db.collection('participants').insertOne({name: req.body.name, lastStatus: Date.now()});

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});

server.post('/messages', async(req, res) => {
    const {to, text, type} = req.body;
    const sender = req.headers.user; 
    const schema = joi.object(
        {
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().required().valid('message', 'private_message') 
        }
    );
    const message = {to: to, text: text, type: type};
    const validation = schema.validate(message, {abortEarly: false});

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    };

    try{
        const existingName = await db.collection('participants').findOne({name: sender});

        if(!existingName){
            return res.status(422).send('O from deve ser um participante existente na lista de participantes');
        };

        await db.collection('messages').insertOne(
            {
                from: sender,
                to: to,
                type: type,
                time: dayjs().format('HH:MM:SS')
            }
        );

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});