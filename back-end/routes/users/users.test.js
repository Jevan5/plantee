const app = require('../../server');
const Auth = require('../../utils/auth');
const CryptoHelper = require('../../utils/cryptoHelper');
const { expect } = require('chai');
const request = require('supertest');
const Mailer = require('../../utils/mailer');
const secrets = require('../../secrets.json');
const sinon = require('sinon');
const User = require('../../models/user/user');

let authenticateRequestStub;
let findByEmailStub;
let findByIdStub;
let findStub;
let generateAuthCodeStub;
let generateRandomStringStub;
let hashSpy;
let pendingPasswordChangeAuthenticationStub;
let pendingRegistrationAuthenticationStub;
let saveDocStub;
let sendPasswordChangeMailStub;
let sendRegistrationMailStub;

const error = 'some error';

const email = 'something@something.com';
const firstName = 'first';
const lastName = 'last';
const password = 'password123';
const newPassword = 'password12345!';
const salt = 'some salt';
const _id = '123';

async function getAll() {
    authenticateRequestStub = sinon.stub(Auth, 'authenticateRequest');
    findByEmailStub = sinon.stub(User, 'findByEmail');
    findByIdStub = sinon.stub(User, 'findById');
    findStub = sinon.stub(User, 'find');
    generateAuthCodeStub = sinon.stub(CryptoHelper, 'generateAuthCode');
    generateRandomStringStub = sinon.stub(CryptoHelper, 'generateRandomString');
    hashSpy = sinon.spy(CryptoHelper, 'hash');
    pendingPasswordChangeAuthenticationStub = sinon.stub(Auth, 'pendingPasswordChangeAuthentication');
    pendingRegistrationAuthenticationStub = sinon.stub(Auth, 'pendingRegistrationAuthentication');
    saveDocStub = sinon.stub(User, 'saveDoc');
    sendPasswordChangeMailStub = sinon.stub(Mailer, 'sendPasswordChangeMail');
    sendRegistrationMailStub = sinon.stub(Mailer, 'sendRegistrationMail');
}

async function restoreAll() {
    authenticateRequestStub.restore();
    findByEmailStub.restore();
    findByIdStub.restore();
    findStub.restore();
    generateAuthCodeStub.restore();
    generateRandomStringStub.restore();
    hashSpy.restore();
    pendingPasswordChangeAuthenticationStub.restore();
    pendingRegistrationAuthenticationStub.restore();
    saveDocStub.restore();
    sendPasswordChangeMailStub.restore();
    sendRegistrationMailStub.restore();
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
    
        it('should reject when error thrown User.saveDoc()', async () => {
            generateAuthCodeStub.restore();
            generateRandomStringStub.restore();
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

        it('should reject when error thrown by Mailer.sendRegistrationMail()', async () => {
            generateAuthCodeStub.restore();
            generateRandomStringStub.restore();
            saveDocStub.returns(new Promise((resolve) => {
                resolve({
                    user: {
                        email
                    }
                });
            }));
            sendRegistrationMailStub.throws(error);

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
            generateAuthCodeStub.returns('012345');
            generateRandomStringStub.returns('6789ABCDEF');

            const user = {
                email,
                firstName,
                lastName,
                password,
                _id
            };

            saveDocStub.returns(new Promise((resolve) => resolve(user)));

            sendRegistrationMailStub.returns(new Promise((resolve) => resolve()));
    
            const res = await request(app).post('/users').send({ user });
    
            const resUser = res.body.user;
    
            const authentication = generateAuthCodeStub.returnValues[0];
            const generatedSalt = generateRandomStringStub.returnValues[0];

            expect(saveDocStub.calledOnceWith({
                disabled: false,
                email,
                firstName,
                hashedAuthentication: CryptoHelper.hash(authentication, generatedSalt),
                hashedNewPassword: '',
                hashedPassword: CryptoHelper.hash(password, generatedSalt),
                lastName,
                salt: generatedSalt
            })).to.be.true;
    
            expect(sendRegistrationMailStub.calledOnceWith(user, authentication)).to.be.true;

            expect(resUser).to.eql(user);
        });
    });
});

describe('PUT', () => {
    describe('/authenticate?email&authentication', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.findByEmail()', async () => {
            findByEmailStub.throws(error);

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=123`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject with non-existent email', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve(null)));

            const res = await request(app).put(`/users/authenticate?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`email (${email}) does not exist.`);
        });

        it('should ignore an already authenticated user', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({ email, hashedAuthentication: '' })));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=123`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) is not pending authentication.`);
        });

        it('should reject an invalid authentication code', async () => {
            const authentication = 'some authentication';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const wrongAuthentication = ' some wrong authentication';

            findByEmailStub.returns(new Promise((resolve) => resolve({ salt, hashedAuthentication })));
            pendingRegistrationAuthenticationStub.returns(true);
            pendingPasswordChangeAuthenticationStub.returns(false);

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${wrongAuthentication}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`authentication (${wrongAuthentication.toUpperCase().trim()}) is invalid.`);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            saveDocStub.throws(error);

            const user = { email, salt, hashedAuthentication, save: () => {} };
            const saveStub = sinon.stub(user, 'save');
            saveStub.throws(error);

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingRegistrationAuthenticationStub.returns(true);
            pendingPasswordChangeAuthenticationStub.returns(false);

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication.toLowerCase()}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it("should authenticate a user's registration", async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const hashedPassword = 'old hashed password';

            const user = { email, salt, hashedAuthentication, hashedPassword, save: () => {} };

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingRegistrationAuthenticationStub.returns(true);
            pendingPasswordChangeAuthenticationStub.returns(false);
            saveDocStub.returns(new Promise((resolve) => resolve('a user')));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication.toLowerCase()}`);

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: '',
                hashedNewPassword: ''
            })).to.be.true;
            expect(res.body.user).to.eql('a user');
        });

        it("should authenticate a user's password change", async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const hashedPassword = 'old hashed password';
            const hashedNewPassword = 'new hashed password';

            const user = { email, salt, hashedAuthentication, hashedPassword, hashedNewPassword, save: () => {} };

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingRegistrationAuthenticationStub.returns(false);
            pendingPasswordChangeAuthenticationStub.returns(true);
            saveDocStub.returns(new Promise((resolve) => resolve('a user')));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication.toLowerCase()}`);

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: '',
                hashedNewPassword: '',
                hashedPassword: hashedNewPassword
            })).to.be.true;
            expect(res.body.user).to.eql('a user');
        });
    });

    describe('/changePassword?email&newPassword', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.findByEmail()', async () => {
            findByEmailStub.throws(error);

            const res = await request(app).put(`/users/changePassword?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject with non-existent email', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve(null)));

            const res = await request(app).put(`/users/changePassword?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`email (${email}) does not exist.`);
        });

        it('should reject when a user is pending registration authentication', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({ email })));
            pendingRegistrationAuthenticationStub.returns(true);

            const res = await request(app).put(`/users/changePassword?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`user (${email}) has not yet authenticated.`);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({ email, salt })));
            pendingRegistrationAuthenticationStub.returns(false);
            saveDocStub.throws(error);
            generateAuthCodeStub.restore();
            generateRandomStringStub.restore();

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by Mailer.sendPasswordChangeMail()', async () => {
            const user = { salt, email };
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingRegistrationAuthenticationStub.returns(false);
            generateAuthCodeStub.returns('012345');
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendPasswordChangeMailStub.throws(error);

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: CryptoHelper.hash(generateAuthCodeStub.returnValues[0], salt),
                hashedNewPassword: CryptoHelper.hash(newPassword, salt)
            })).to.be.true;
        });

        it('should create a password change request', async () => {
            const user = { salt, email };
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingRegistrationAuthenticationStub.returns(false);
            generateAuthCodeStub.returns('012345');
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendPasswordChangeMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: CryptoHelper.hash(authentication, salt),
                hashedNewPassword: CryptoHelper.hash(newPassword, salt)
            })).to.be.true;
            expect(sendPasswordChangeMailStub.calledOnceWith({ email, firstName }, authentication)).to.be.true;
            expect(res.body.user).to.eql({ email, firstName });
        });
    });

    describe('/regenerateAuthentication?email', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.findByEmail()', async () => {
            findByEmailStub.throws(error);

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject with non-existent email', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve(null)));

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`email (${email}) does not exist.`);
        });

        it('should ignore a user with no pending authentications', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({ email })));
            pendingPasswordChangeAuthenticationStub.returns(false);
            pendingRegistrationAuthenticationStub.returns(false);

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) is not pending authentication.`);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            generateAuthCodeStub.restore();
            generateRandomStringStub.restore();
            findByEmailStub.returns(new Promise((resolve) => resolve({ hashedAuthentication: 'some hash', salt })));
            pendingRegistrationAuthenticationStub.returns(true);
            saveDocStub.throws(error);

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by Mailer.sendPasswordChangeMail()', async () => {
            const hashedAuthentication = 'some hash';
            generateAuthCodeStub.returns('012345');
            findByEmailStub.returns(new Promise((resolve) => resolve({ hashedAuthentication, salt })));
            pendingPasswordChangeAuthenticationStub.returns(true);
            pendingRegistrationAuthenticationStub.returns(false);
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendPasswordChangeMailStub.throws(error);

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                hashedAuthentication: CryptoHelper.hash(generateAuthCodeStub.returnValues[0], salt),
                salt
            })).to.be.true;
        });

        it('should reject when error thrown by Mailer.sendRegistrationMail()', async () => {
            const hashedAuthentication = 'some hash';
            generateAuthCodeStub.returns('012345');
            findByEmailStub.returns(new Promise((resolve) => resolve({ hashedAuthentication, salt })));
            pendingPasswordChangeAuthenticationStub.returns(false);
            pendingRegistrationAuthenticationStub.returns(true);
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendRegistrationMailStub.throws(error);

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                hashedAuthentication: CryptoHelper.hash(generateAuthCodeStub.returnValues[0], salt),
                salt
            })).to.be.true;
        });

        it('should regenerate authentication code for registration', async () => {
            const hashedAuthentication = 'some hash';
            const user = { hashedAuthentication, salt, email, firstName };
            generateAuthCodeStub.returns('012345');
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingPasswordChangeAuthenticationStub.returns(false);
            pendingRegistrationAuthenticationStub.returns(true);
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendRegistrationMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(findByEmailStub.calledOnceWith(email)).to.be.true;
            expect(generateAuthCodeStub.calledOnce).to.be.true;
            expect(hashSpy.calledOnceWith(authentication, salt)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: hashSpy.returnValues[0]
            })).to.be.true;
            expect(sendRegistrationMailStub.calledOnceWith({ email, firstName }, authentication)).to.be.true;
            expect(res.body.user).to.eql(await saveDocStub.returnValues[0]);
        });

        it('should regenerate authentication code for password change', async () => {
            const hashedAuthentication = 'some hash';
            const user = { hashedAuthentication, salt, email, firstName };
            generateAuthCodeStub.returns('012345');
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            pendingPasswordChangeAuthenticationStub.returns(true);
            pendingRegistrationAuthenticationStub.returns(false);
            saveDocStub.returns(new Promise((resolve) => resolve({ email, firstName })));
            sendPasswordChangeMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/regenerateAuthentication?email=${email}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(findByEmailStub.calledOnceWith(email)).to.be.true;
            expect(generateAuthCodeStub.calledOnce).to.be.true;
            expect(hashSpy.calledOnceWith(authentication, salt)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: hashSpy.returnValues[0]
            })).to.be.true;
            expect(sendPasswordChangeMailStub.calledOnceWith({ email, firstName }, authentication)).to.be.true;
            expect(res.body.user).to.eql(await saveDocStub.returnValues[0]);
        });
    });
});
