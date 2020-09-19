const bodyParser = require('body-parser');
const { environment } = require('./environment');
const cors = require('cors');
const express = require('express');
const app = express();
const Auth = require('./utils/auth');
const http = require('http');
const mongoose = require('mongoose');

async function startServer() {
    await mongoose.connect(`${environment.mongo.url}:${environment.mongo.port}/${environment.db}`, {
        useCreateIndex: true,
        useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', `Origin, X-Requested-With, Content-Type, Accept, Access, ${Auth.header}`);
        res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');	
        next();
    });

    app.use('/ownedPlants', require('./routes/ownedPlants/ownedPlants'));
    app.use('/users', require('./routes/users/users'));

    http.createServer(app).listen(environment.api.port, () => {
        console.log(`Listening at ${environment.api.url}:${environment.api.port} for HTTP connections`);
    });
}

startServer();

module.exports = app;
