const app = require('../../server');
const Auth = require('../../utils/auth');
const ErrorMessage = require('../../utils/errorMessage');
const { expect } = require('chai');
const OwnedPlant = require('../../models/ownedPlant/ownedPlant');
const request = require('supertest');
const sinon = require('sinon');

const error = 'some error';
const email = 'something@something.com';
const id = '456';
const userId = '123';
const password = 'some password';
const amountWaterMl = 100;
const lastWatered = new Date();
const name = 'cactus';
const wateringPeriodDays = 3;
const newAmountWaterMl = 150;
const newLastWatered = new Date();
const newName = 'cactus 2';
const newWateringPeriodDays = 5;

let assertIdMatchesStub;
let authenticateRequestStub;
let createStub;
let findByIdStub;
let findByIdAnDeleteStub;
let findStub;
let saveDocStub;

function getAll() {
    assertIdMatchesStub = sinon.stub(Auth, 'assertIdMatches');
    authenticateRequestStub = sinon.stub(Auth, 'authenticateRequest');
    createStub = sinon.stub(ErrorMessage, 'create');
    findByIdStub = sinon.stub(OwnedPlant, 'findById');
    findByIdAnDeleteStub = sinon.stub(OwnedPlant, 'findByIdAndDelete');
    findStub = sinon.stub(OwnedPlant, 'find');
    saveDocStub = sinon.stub(OwnedPlant, 'saveDoc');
}

function restoreAll() {
    assertIdMatchesStub.restore();
    authenticateRequestStub.restore();
    createStub.restore();
    findByIdStub.restore();
    findByIdAnDeleteStub.restore();
    findStub.restore();
    saveDocStub.restore();
}

describe('DELETE', () => {
    describe('/:_ownedPlantId', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by Auth.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(findByIdStub.called).to.be.false;
            expect(assertIdMatchesStub.called).to.be.false;
            expect(findByIdAnDeleteStub.called).to.be.false;
        });

        it('should reject when error thrown by OwnedPlant.findById()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.throws(error);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.called).to.be.false;
            expect(findByIdAnDeleteStub.called).to.be.false;
        });

        it('should reject when OwnedPlant.findById() returns null', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve(null)));
            createStub.returns(error);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(createStub.calledOnceWith(`Owned plant (${id}) does not exist.`, ErrorMessage.codes.NOT_FOUND)).to.be.true;
            expect(assertIdMatchesStub.called).to.be.false;
            expect(findByIdAnDeleteStub.called).to.be.false;
        });

        it('should reject when error thrown by Auth.assertIdMatches()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId })));
            assertIdMatchesStub.throws(error);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(findByIdAnDeleteStub.called).to.be.false;
        });
        
        it('should reject when error thrown by OwnedPlant.findByIdAndDelete()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId })));
            assertIdMatchesStub.returns(null);
            findByIdAnDeleteStub.throws(error);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(findByIdAnDeleteStub.calledOnceWith(id)).to.be.true;
        });

        it('should delete an OwnedPlant', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId })));
            assertIdMatchesStub.returns(null);
            findByIdAnDeleteStub.returns(null);

            const res = await request(app).delete(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(200);
            expect(res.body.ownedPlant).to.eql({ _userId: userId });
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(findByIdAnDeleteStub.calledOnceWith(id)).to.be.true;
        });
    });
});

describe('GET', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by Auth.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).get('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findStub.called).to.eql(false);
        });

        it('should reject when error thrown by OwnedPlant.find()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findStub.throws(error);

            const res = await request(app).get('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findStub.getCalls()[0].firstArg).to.eql({ _userId: user._id });
        });

        it('should get owned plants for the user', async () => {
            const user = { _id: userId };
            const ownedPlants = [1, 2, 3, 4, 5];
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findStub.returns(new Promise((resolve) => resolve(ownedPlants)));

            const res = await request(app).get('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.body.ownedPlants).to.eql(ownedPlants);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findStub.getCalls()[0].firstArg).to.eql({ _userId: user._id });
        });
    });
});

describe('POST', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by Auth.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).post('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(saveDocStub.called).to.eql(false);
        });

        it('should reject when error thrown by OwnedPlant.saveDoc()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.throws(error);

            const res = await request(app).post('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    amountWaterMl,
                    lastWatered,
                    name,
                    wateringPeriodDays
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(saveDocStub.calledOnceWith({
                _userId: user._id,
                amountWaterMl,
                lastWatered,
                name,
                wateringPeriodDays
            })).to.be.true;
        });

        it('should create an OwnedPlant', async () => {
            const user = { _id: userId };
            const ownedPlant = {
                _userId: user._id,
                amountWaterMl,
                lastWatered,
                name,
                wateringPeriodDays
            };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.returns(new Promise((resolve) => resolve('the new plant')));

            const res = await request(app).post('/ownedPlants').set(Auth.header, Auth.valueForHeader(email, password)).send({ ownedPlant });

            const resOwnedPlant = res.body.ownedPlant;

            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(saveDocStub.calledOnceWith(ownedPlant)).to.be.true;
            expect(resOwnedPlant).to.eql('the new plant');
        });
    });
});

describe('PUT', () => {
    describe('/:_ownedPlantId', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by Auth.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.called).to.eql(false);
            expect(assertIdMatchesStub.called).to.eql(false);
            expect(saveDocStub.called).to.eql(false);
        });

        it('should reject when error thrown by OwnedPlant.findById()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.throws(error);
            
            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    amountWaterMl: newAmountWaterMl,
                    name: newName,
                    wateringPeriodDays: newWateringPeriodDays
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.called).to.be.false;
            expect(saveDocStub.called).to.be.false;
        });

        it('should reject when OwnedPlant.findById() returns null', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve(null)));
            createStub.returns(error);
            
            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    amountWaterMl: newAmountWaterMl,
                    name: newName,
                    wateringPeriodDays: newWateringPeriodDays
                }
            });

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(createStub.calledOnceWith(`Owned plant (${id}) does not exist.`, ErrorMessage.codes.NOT_FOUND));
            expect(assertIdMatchesStub.called).to.be.false;
            expect(saveDocStub.called).to.be.false;
        });

        it('should reject when error thrown by Auth.assertIdMatches()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId })));
            assertIdMatchesStub.throws(error);

            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    amountWaterMl: newAmountWaterMl,
                    name: newName,
                    wateringPeriodDays: newWateringPeriodDays
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(saveDocStub.called).to.be.false;
        });

        it('should reject when error thrown by OwnedPlant.saveDoc()', async () => {
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId, _id: id })));
            assertIdMatchesStub.returns(null);
            saveDocStub.throws(error);

            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    amountWaterMl: newAmountWaterMl,
                    lastWatered: newLastWatered,
                    name: newName,
                    wateringPeriodDays: newWateringPeriodDays
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                _id: id,
                _userId: userId,
                amountWaterMl: newAmountWaterMl,
                lastWatered: newLastWatered,
                name: newName,
                wateringPeriodDays: newWateringPeriodDays
            })).to.be.true;
        });

        it('should update an OwnedPlant', async () => {
            const newId = '789';
            const newUserId = '0ab';
            const user = { _id: userId };
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));
            findByIdStub.returns(new Promise((resolve) => resolve({ _userId: userId, _id: id })));
            assertIdMatchesStub.returns(null);
            saveDocStub.returns(new Promise((resolve) => resolve('the updated plant')));

            const res = await request(app).put(`/ownedPlants/${id}`).set(Auth.header, Auth.valueForHeader(email, password)).send({
                ownedPlant: {
                    _id: newId,
                    _userId: newUserId,
                    amountWaterMl: newAmountWaterMl,
                    lastWatered: newLastWatered,
                    name: newName,
                    wateringPeriodDays: newWateringPeriodDays
                }
            });

            expect(res.status).to.eql(200);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
            expect(findByIdStub.calledOnceWith(id)).to.be.true;
            expect(assertIdMatchesStub.calledOnceWith(userId, userId)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                _id: id,
                _userId: userId,
                amountWaterMl: newAmountWaterMl,
                lastWatered: newLastWatered,
                name: newName,
                wateringPeriodDays: newWateringPeriodDays
            })).to.be.true;
            expect(res.body.ownedPlant).to.eql('the updated plant');
        });
    });
});
