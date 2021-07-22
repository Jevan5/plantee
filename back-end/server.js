const bodyParser = require('body-parser');
const { Environment, environment } = require('./environment');
const cors = require('cors');
const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const User = require('./models/user/user');

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
        res.setHeader('Access-Control-Allow-Headers', `Origin, X-Requested-With, Content-Type, Accept, Access, ${User.header()}`);
        res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');	
        next();
    });

    app.get('/.well-known/pki-validation/5545AED14C807BE9ABAAC9AF41EF96C3.txt', (req, res) => {
        res.send('CB9A7AB464E216F80A99BCBB66129CD39FDAE85398711D6C4BAD38B1C2F12934 comodoca.com 5f675d6028240');
    });

    app.use('/ownedPlants', require('./routes/ownedPlants/ownedPlants'));
    app.use('/users', require('./routes/users/users'));

    let server;
    if (environment.mode === Environment.modeEnum.PROD) {
        server = https.createServer({
            cert: fs.readFileSync('../../cert/server.crt', 'utf-8'),
            key: fs.readFileSync('../../cert/server.key', 'utf-8')
        }, app);
    } else {
        server = http.createServer(app);
    }

    server.listen(environment.api.port, () => {
        console.log(`Listening at ${environment.api.url}:${environment.api.port} for HTTP${environment.mode === Environment.modeEnum.PROD ? 'S' : ''} connections`);
    });
}

startServer();

module.exports = app;
