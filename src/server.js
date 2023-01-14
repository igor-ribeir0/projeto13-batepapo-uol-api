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