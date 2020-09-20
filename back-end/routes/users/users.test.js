const app = require('../../server');
const Auth = require('../../utils/auth');
const CryptoHelper = require('../../utils/cryptoHelper');
const { environment } = require('../../environment');
const { expect } = require('chai');
const request = require('supertest');
const Mailer = require('../../utils/mailer');
const sinon = require('sinon');
const User = require('../../models/user/user');

let authenticateRequestStub;
let findByIdStub;
let findStub;
let generateRandomStringSpy;
let saveDocStub;
let sendMailStub;

const error = 'some error';

const email = 'something@something.com';
const firstName = 'first';
const lastName = 'last';
const password = 'password123';
const _id = '123';

async function getAll() {
    authenticateRequestStub = sinon.stub(Auth, 'authenticateRequest');
    findByIdStub = sinon.stub(User, 'findById');
    findStub = sinon.stub(User, 'find');
    generateRandomStringSpy = sinon.spy(CryptoHelper, 'generateRandomString');
    saveDocStub = sinon.stub(User, 'saveDoc');
    sendMailStub = sinon.stub(Mailer, 'sendMail');
}

async function restoreAll() {
    authenticateRequestStub.restore();
    findByIdStub.restore();
    findStub.restore();
    generateRandomStringSpy.restore();
    saveDocStub.restore();
    sendMailStub.restore();
}

describe('GET', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by finding users', async () => {
            findStub.throws(error);

            const res = await request(app).get('/users');
        
            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(findStub.called).true;
        });
    
        it('should get all users', async () => {
            const users = [1, 2, 3];
            findStub.returns(new Promise((resolve) => resolve(users)));
    
            const res = await request(app).get('/users');

            expect(res.body.users).to.eql(users);
            expect(findStub.called).to.eql(true);
        });
    });

    describe('/login', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by Auth.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).get('/users/login').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
        });

        it('should login', async () => {
            const user = 'a user';
            authenticateRequestStub.returns(new Promise((resolve) => resolve(user)));

            const res = await request(app).get('/users/login').set(Auth.header, Auth.valueForHeader(email, password));

            expect(res.body.user).to.eql(user);
            expect(authenticateRequestStub.getCalls()[0].firstArg.headers[Auth.header.toLowerCase()]).to.eql(Auth.valueForHeader(email, password));
        });
    });
});

describe('POST', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);
    
        it('should reject when error thrown by saving a user', async () => {
            saveDocStub.throws(error);

            const res = await request(app).post('/users').send({
                user: {
                    email,
                    firstName,
                    lastName,
                    password
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by sending email', async () => {
            saveDocStub.returns(new Promise((resolve) => {
                resolve({
                    user: {
                        email
                    }
                });
            }));
            sendMailStub.throws(error);

            const res = await request(app).post('/users').send({
                user: {
                    email,
                    firstName,
                    lastName,
                    password
                }
            });

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });
    
        it('should create a User', async () => {
            const user = {
                email,
                firstName,
                lastName,
                password,
                _id
            };

            saveDocStub.returns(new Promise((resolve) => resolve(user)));

            sendMailStub.returns(new Promise((resolve) => resolve()));
    
            const res = await request(app).post('/users').send({ user });
    
            const resUser = res.body.user;
    
            const authentication = generateRandomStringSpy.returnValues[0].toUpperCase();
            const salt = generateRandomStringSpy.returnValues[1];

            expect(saveDocStub.calledOnceWith({
                disabled: false,
                email,
                firstName,
                hashedAuthentication: CryptoHelper.hash(authentication, salt),
                hashedPassword: CryptoHelper.hash(password, salt),
                lastName,
                salt
            })).to.be.true;
    
            expect(sendMailStub.calledOnceWith(
                user.email, 'Authenticate Account', `Hi ${user.firstName},\n\nOn behalf of the entire team, welcome to Plantee ${String.fromCodePoint(0x1F973)}\n\nMy name is Josh Evans, and I designed Plantee to help people like yourself and I who just want to keep our ${String.fromCodePoint(0x1F331)}'s alive and ${String.fromCodePoint(0x1F603)}\n\nPlease use this authentication code to authenticate your account: ${authentication}\n\nHappy planting ${String.fromCodePoint(0x1F44B)}\n\nCheers,\nJosh Evans\nFounder of Plantee`)
            ).to.be.true;

            expect(resUser).to.eql(user);
        });
    });
});

describe('PUT', () => {
    describe('/:_userId/:authentication', () => {

        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by finding a user', async () => {
            findByIdStub.throws(error);

            const res = await request(app).put('/users/123/abc');

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject with non-existent id', async () => {
            findByIdStub.returns(new Promise((resolve) => resolve(null)));

            const res = await request(app).put(`/users/${_id}/abc`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`_userId (${_id}) does not exist.`);
        });

        it('should ignore an already authenticated user', async () => {
            findByIdStub.returns(new Promise((resolve) => resolve({ email, hashedAuthentication: '' })));

            const res = await request(app).put(`/users/${_id}/abc`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) is already authenticated.`);
        });

        it('should reject an invalid authentication code', async () => {
            const salt = 'some salt';
            const authentication = 'some authentication';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const wrongAuthentication = 'some wrong authentication';

            findByIdStub.returns(new Promise((resolve) => resolve({ salt, hashedAuthentication })));

            const res = await request(app).put(`/users/123/${wrongAuthentication}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`authentication (${wrongAuthentication}) is invalid.`);
        });

        it('should reject when error thrown by saving a user', async () => {
            const salt = 'some salt';
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);

            const user = { email, salt, hashedAuthentication, save: () => {} };
            const saveStub = sinon.stub(user, 'save');
            saveStub.throws(error);

            findByIdStub.returns(new Promise((resolve) => resolve(user)));

            const res = await request(app).put(`/users/123/${authentication}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should authenticate a user', async () => {
            const salt = 'some salt';
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);

            const user = { email, salt, hashedAuthentication, save: () => {} };
            const saveSpy = sinon.spy(user, 'save');

            findByIdStub.returns(new Promise((resolve) => resolve(user)));

            const res = await request(app).put(`/users/123/${authentication}`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) has been authenticated.`);
            expect(saveSpy.calledOnce).to.be.true;
            expect(user.hashedAuthentication).to.eql('');
        });
    });
});
