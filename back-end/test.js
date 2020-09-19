const { environment } = require('./environment');
const mongoose = require('mongoose');

async function waitForIndices() {
    await require('./models/ownedPlant/ownedPlant').ensureIndexes();
    await require('./models/user/user').ensureIndexes();
}

function runTest(name, path) {
    describe(name, () => {
        require(path);
    });
}

before(async () => {
    await mongoose.disconnect();
    await mongoose.connect(`${environment.mongo.url}:${environment.mongo.port}/${environment.db}`, {
        useCreateIndex: true,
        useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await mongoose.connection.db.dropDatabase();
    await waitForIndices();
});

describe('Tests', () => {
    describe('Models', () => {
        runTest('OwnedPlant', './models/ownedPlant/ownedPlant.test');
        runTest('User', './models/user/user.test');
    });

    describe('Routes', () => {
        runTest('/ownedPlants', './routes/ownedPlants/ownedPlants.test');
        runTest('/users', './routes/users/users.test');
    });
});
