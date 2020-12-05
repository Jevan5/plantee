const app = require('../../server');
const CryptoHelper = require('../../utils/cryptoHelper');
const { expect } = require('chai');
const request = require('supertest');
const Mailer = require('../../utils/mailer');
const sinon = require('sinon');
const User = require('../../models/user/user');

let authenticateLoginStub;
let authenticateRequestStub;
let concatenateTokenAndIpSpy;
let findByEmailStub;
let findByIdStub;
let findStub;
let generateAuthCodeStub;
let generateSaltStub;
let generateTokenStub;
let hashSpy;
let nowStub;
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
const authCode = '012345';
const now = 999;
const token = 'some token';

async function getAll() {
    authenticateLoginStub = sinon.stub(User, 'authenticateLogin');
    authenticateRequestStub = sinon.stub(User, 'authenticateRequest');
    concatenateTokenAndIpSpy = sinon.spy(User, 'concatenateTokenAndIp');
    findByEmailStub = sinon.stub(User, 'findByEmail');
    findByIdStub = sinon.stub(User, 'findById');
    findStub = sinon.stub(User, 'find');
    generateAuthCodeStub = sinon.stub(User, 'generateAuthCode');
    generateSaltStub = sinon.stub(User, 'generateSalt');
    generateTokenStub = sinon.stub(User, 'generateToken');
    hashSpy = sinon.stub(CryptoHelper, 'hash');
    nowStub = sinon.stub(Date, 'now');
    saveDocStub = sinon.stub(User, 'saveDoc');
    sendPasswordChangeMailStub = sinon.stub(Mailer, 'sendPasswordChangeMail');
    sendRegistrationMailStub = sinon.stub(Mailer, 'sendRegistrationMail');
}

async function restoreAll() {
    authenticateLoginStub.restore();
    authenticateRequestStub.restore();
    concatenateTokenAndIpSpy.restore();
    findByEmailStub.restore();
    findByIdStub.restore();
    findStub.restore();
    generateAuthCodeStub.restore();
    generateSaltStub.restore();
    generateTokenStub.restore();
    hashSpy.restore();
    nowStub.restore();
    saveDocStub.restore();
    sendPasswordChangeMailStub.restore();
    sendRegistrationMailStub.restore();
}

describe('GET', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by authenticating request', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).get('/users');
        
            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(authenticateRequestStub.called).true;
        });
    
        it('should get the authenticated user', async () => {
            authenticateRequestStub.returns(new Promise((resolve) => resolve('some user')));
    
            const res = await request(app).get('/users');

            expect(res.body.user).to.eql(await authenticateRequestStub.returnValues[0]);
            expect(authenticateRequestStub.called).to.be.true;
        });
    });
});

describe('DELETE', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.authenticateRequest()', async () => {
            authenticateRequestStub.throws(error);

            const res = await request(app).delete('/users/logout').set(User.header(), User.valueForHeader(email, token));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            authenticateRequestStub.returns(new Promise(resolve => resolve({})));
            saveDocStub.throws(error);

            const res = await request(app).delete('/users/logout').set(User.header(), User.valueForHeader(email, token));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should logout', async () => {
            const user = {};
            authenticateRequestStub.returns(new Promise(resolve => resolve(user)));
            saveDocStub.returns(new Promise(resolve => resolve({ email })));

            const res = await request(app).delete('/users/logout').set(User.header(), User.valueForHeader(email, token));

            expect(res.body.message).to.eql(`Logged out of ${(await saveDocStub.returnValues[0]).email}.`);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedTokenAndIp: null,
                tokenGeneratedTimestamp: null
            })).to.be.true;
        });
    });
});

describe('POST', () => {
    describe('/', () => {
        beforeEach(getAll);
        afterEach(restoreAll);
    
        it('should reject when error thrown User.saveDoc()', async () => {
            generateAuthCodeStub.restore();
            generateSaltStub.restore();
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
            generateSaltStub.restore();
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
            generateAuthCodeStub.returns(authCode);
            generateSaltStub.returns(salt);
            nowStub.returns(now);

            const user = {
                email,
                firstName,
                lastName,
                password,
                _id,
                hash: (secret) => `${secret}${secret}`
            };
            const userHashSpy = sinon.spy(user, 'hash');

            saveDocStub.returns(new Promise((resolve) => resolve(user)));

            sendRegistrationMailStub.returns(new Promise((resolve) => resolve()));
    
            const res = await request(app).post('/users').send({ user });
    
            const resUser = res.body.user;
    
            const generatedAuthentication = generateAuthCodeStub.returnValues[0];
            const generatedSalt = generateSaltStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                disabled: false,
                email,
                firstName,
                hashedAuthentication: hashSpy.returnValues[0],
                hashedNewPassword: null,
                hashedPassword: hashSpy.returnValues[1],
                hashedTokenAndIp: null,
                lastName,
                salt: generatedSalt,
                tokenGeneratedTimestamp: now
            })).to.be.true;
            expect(hashSpy.getCalls()[0].args).to.be.eql([generatedAuthentication, generatedSalt]);
            expect(hashSpy.getCalls()[1].args).to.be.eql([password, generatedSalt]);
            expect(sendRegistrationMailStub.calledOnceWith(user, generatedAuthentication)).to.be.true;
            delete user['hash'];
            expect(resUser).to.eql(user);
        });
    });

    describe('/login', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.authenticateLogin()', async () => {
            authenticateLoginStub.throws(error);

            const res = await request(app).post('/users/login').set(User.header(), User.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            authenticateLoginStub.returns(new Promise(resolve => resolve({
                salt,
                hash: () => null
            })));
            generateTokenStub.restore();
            nowStub.restore();
            saveDocStub.throws(error);

            const res = await request(app).post('/users/login').set(User.header(), User.valueForHeader(email, password));

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should login', async () => {
            const user = {
                salt,
                hash: () => token
            };
            const userHashSpy = sinon.spy(user, 'hash');
            authenticateLoginStub.returns(new Promise((resolve) => resolve(user)));
            generateTokenStub.returns(token);
            nowStub.returns(now);
            saveDocStub.returns();

            const res = await request(app).post('/users/login').set(User.header(), User.valueForHeader(email, password));

            expect(res.body.token).to.eql(generateTokenStub.returnValues[0]);
            expect(authenticateLoginStub.getCalls()[0].firstArg.headers[User.header().toLowerCase()]).to.eql(User.valueForHeader(email, password));
            expect(userHashSpy.calledOnceWith(concatenateTokenAndIpSpy.returnValues[0])).to.be.true;
            expect(saveDocStub.calledOnceWith({
                ...await authenticateLoginStub.returnValues[0],
                hashedTokenAndIp: userHashSpy.returnValues[0],
                tokenGeneratedTimestamp: nowStub.returnValues[0]
            })).to.be.true;
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
            findByEmailStub.returns(new Promise((resolve) => resolve({
                email,
                hashedAuthentication: null,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => false
            })));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=123`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) is not pending authentication.`);
        });

        it('should reject an invalid authentication code', async () => {
            const wrongAuthentication = ' some wrong authentication';

            findByEmailStub.returns(new Promise((resolve) => resolve({
                salt,
                assertAuthenticationMatches: () => { throw error; },
                pendingPasswordChangeAuthentication: () => true,
                pendingRegistrationAuthentication: () => false
            })));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${wrongAuthentication}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(error);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            saveDocStub.throws(error);

            const user = {
                email,
                salt,
                hashedAuthentication,
                assertAuthenticationMatches: () => null,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => true
            };

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.throws(error);

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it("should authenticate a user's registration", async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const hashedPassword = 'old hashed password';
            const userResponse = 'a user';

            const user = {
                email,
                salt,
                hashedAuthentication,
                hashedPassword,
                assertAuthenticationMatches: () => null,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => true
            };

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.returns(new Promise((resolve) => resolve(userResponse)));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication}`);

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: null,
                hashedNewPassword: null
            })).to.be.true;
            expect(res.body.user).to.eql(userResponse);
        });

        it("should authenticate a user's password change", async () => {
            const authentication = 'SOME AUTHENTICATION';
            const hashedAuthentication = CryptoHelper.hash(authentication, salt);
            const hashedPassword = 'old hashed password';
            const hashedNewPassword = 'new hashed password';
            const userResponse = 'a user';

            const user = {
                email,
                salt,
                hashedAuthentication,
                hashedPassword,
                hashedNewPassword,
                assertAuthenticationMatches: () => null,
                pendingPasswordChangeAuthentication: () => true,
                pendingRegistrationAuthentication: () => false
            };

            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.returns(new Promise((resolve) => resolve(userResponse)));

            const res = await request(app).put(`/users/authenticate?email=${email}&authentication=${authentication}`);

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: null,
                hashedNewPassword: null,
                hashedPassword: hashedNewPassword
            })).to.be.true;
            expect(res.body.user).to.eql(userResponse);
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
            findByEmailStub.returns(new Promise((resolve) => resolve({
                email,
                assertRegistrationAuthenticated: () => { throw error; }
            })));

            const res = await request(app).put(`/users/changePassword?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(error);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({
                email,
                salt,
                assertRegistrationAuthenticated: () => null,
                hash: () => null
            })));
            saveDocStub.throws(error);
            generateAuthCodeStub.restore();

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by Mailer.sendPasswordChangeMail()', async () => {
            const user = {
                salt,
                email,
                assertRegistrationAuthenticated: () => null,
                hash: (plaintext) => `${plaintext}${plaintext}`
            };
            const userHashSpy = sinon.spy(user, 'hash');
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            generateAuthCodeStub.returns(authCode);
            saveDocStub.returns(new Promise((resolve) => resolve(null)));
            sendPasswordChangeMailStub.throws(error);

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0],
                hashedNewPassword: userHashSpy.returnValues[1]
            })).to.be.true;
            expect(userHashSpy.getCalls()[0].args).to.eql([authCode]);
            expect(userHashSpy.getCalls()[1].args).to.eql([newPassword]);
        });

        it('should create a password change request', async () => {
            const user = {
                salt,
                email,
                assertRegistrationAuthenticated: () => null,
                hash: (plaintext) => `${plaintext}${plaintext}`
            };
            const userHashSpy = sinon.spy(user, 'hash');
            const saveDocResponse = 'a user';
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            generateAuthCodeStub.returns(authCode);
            saveDocStub.returns(new Promise((resolve) => resolve(saveDocResponse)));
            sendPasswordChangeMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/changePassword?email=${email}&newPassword=${newPassword}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0],
                hashedNewPassword: userHashSpy.returnValues[1]
            })).to.be.true;
            expect(userHashSpy.getCalls()[0].args).to.eql([generateAuthCodeStub.returnValues[0]]);
            expect(userHashSpy.getCalls()[1].args).to.eql([newPassword]);
            const sendPasswordChangeMailStubCalls = sendPasswordChangeMailStub.getCalls();
            expect(sendPasswordChangeMailStub.calledOnceWith(saveDocResponse, authentication)).to.be.true;
            expect(res.body.user).to.eql(saveDocResponse);
        });
    });

    describe('/regenerateAuthenticationCode?email', () => {
        beforeEach(getAll);
        afterEach(restoreAll);

        it('should reject when error thrown by User.findByEmail()', async () => {
            findByEmailStub.throws(error);

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject with non-existent email', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve(null)));

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(500);
            expect(res.error.text).to.eql(`email (${email}) does not exist.`);
        });

        it('should ignore a user with no pending authentications', async () => {
            findByEmailStub.returns(new Promise((resolve) => resolve({
                email,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => false
            })));

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(200);
            expect(res.text).to.eql(`user (${email}) is not pending authentication.`);
        });

        it('should reject when error thrown by User.saveDoc()', async () => {
            generateAuthCodeStub.returns(null);
            findByEmailStub.returns(new Promise((resolve) => resolve({
                hash: () => null,
                hashedAuthentication: 'some hash',
                pendingRegistrationAuthentication: () => true,
                salt
            })));
            saveDocStub.throws(error);

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
        });

        it('should reject when error thrown by Mailer.sendPasswordChangeMail()', async () => {
            const user = {
                hash: () => null,
                pendingPasswordChangeAuthentication: () => true,
                pendingRegistrationAuthentication: () => false,
                salt
            };
            generateAuthCodeStub.returns(authCode);
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.returns(new Promise((resolve) => resolve(user)));
            const userHashSpy = sinon.spy(user, 'hash');
            sendPasswordChangeMailStub.throws(error);

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0]
            })).to.be.true;
            expect(userHashSpy.calledOnceWith(authCode)).to.be.true;
        });

        it('should reject when error thrown by Mailer.sendRegistrationMail()', async () => {
            const user = {
                hash: () => null,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => true,
                salt
            };
            generateAuthCodeStub.returns(authCode);
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            saveDocStub.returns(new Promise((resolve) => resolve(user)));
            const userHashSpy = sinon.spy(user, 'hash');
            sendRegistrationMailStub.throws(error);

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            expect(res.status).to.eql(500);
            expect(JSON.parse(res.error.text).name).to.eql(error);
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0]
            })).to.be.true;
            expect(userHashSpy.calledOnceWith(authCode)).to.be.true;
        });

        it('should regenerate authentication code for registration', async () => {
            const hashedAuthentication = 'some hash';
            const user = {
                hash: () => hashedAuthentication,
                pendingPasswordChangeAuthentication: () => false,
                pendingRegistrationAuthentication: () => true,
                salt
            };
            const userHashSpy = sinon.spy(user, 'hash');
            generateAuthCodeStub.returns(authCode);
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            const updatedUser = {
                ...user,
                hashedAuthentication
            };
            saveDocStub.returns(new Promise((resolve) => resolve(updatedUser)));
            sendRegistrationMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(findByEmailStub.calledOnceWith(email)).to.be.true;
            expect(generateAuthCodeStub.calledOnce).to.be.true;
            expect(userHashSpy.calledOnceWith(authCode)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0]
            })).to.be.true;
            expect(sendRegistrationMailStub.calledOnceWith(updatedUser, authentication)).to.be.true;
            ['hash', 'pendingPasswordChangeAuthentication', 'pendingRegistrationAuthentication'].forEach(key => delete updatedUser[key]);
            expect(res.body.user).to.eql(updatedUser);
        });

        it('should regenerate authentication code for password change', async () => {
            const hashedAuthentication = 'some hash';
            const user = {
                hash: () => hashedAuthentication,
                pendingPasswordChangeAuthentication: () => true,
                pendingRegistrationAuthentication: () => false,
                salt
            };
            const userHashSpy = sinon.spy(user, 'hash');
            generateAuthCodeStub.returns(authCode);
            findByEmailStub.returns(new Promise((resolve) => resolve(user)));
            const updatedUser = {
                ...user,
                hashedAuthentication
            };
            saveDocStub.returns(new Promise((resolve) => resolve(updatedUser)));
            sendPasswordChangeMailStub.returns(new Promise((resolve) => resolve()));

            const res = await request(app).put(`/users/regenerateauthenticationCode?email=${email}`);

            const authentication = generateAuthCodeStub.returnValues[0];

            expect(res.status).to.eql(200);
            expect(findByEmailStub.calledOnceWith(email)).to.be.true;
            expect(generateAuthCodeStub.calledOnce).to.be.true;
            expect(userHashSpy.calledOnceWith(authCode)).to.be.true;
            expect(saveDocStub.calledOnceWith({
                ...user,
                hashedAuthentication: userHashSpy.returnValues[0]
            })).to.be.true;
            expect(sendPasswordChangeMailStub.calledOnceWith(updatedUser, authentication)).to.be.true;
            ['hash', 'pendingPasswordChangeAuthentication', 'pendingRegistrationAuthentication'].forEach(key => delete updatedUser[key]);
            expect(res.body.user).to.eql(updatedUser);
        });
    });
});
