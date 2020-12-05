const CryptoHelper = require('../../utils/cryptoHelper');
const ErrorMessage = require('../../utils/errorMessage');
const { expect } = require('chai');
const sinon = require('sinon');
const TestUtils = require('../../utils/testUtils');
const User = require('./user');

function getUserData() {
    return {
        disabled: false,
        email: ' test Email ',
        firstName: 'test firstName',
        hashedAuthentication: 'test hashedAuthentication',
        hashedNewPassword: 'test hashedNewPassword',
        hashedPassword: 'test hashedPassword',
        hashedTokenAndIp: 'test hashedTokenAndIp',
        lastName: 'test lastName',
        salt: 'test salt',
        tokenGeneratedTimestamp: Date.now()
    };
}

describe('Instance Methods', () => {
    const authentication = ' Some Authentication';
    const ip = 'some ip';
    const password = 'some password';
    const plaintext = 'some plaintext';
    const token = 'some token';
    let concatenateTokenAndIpStub;
    let hashEqualsSpy;
    let hashSpy;
    let nowStub;
    let throwStub;
    let tokenValidityDaysStub;
    let user;

    async function beforeEachCallback() {
        await User.deleteMany();
        user = await User.saveDoc(getUserData());
        concatenateTokenAndIpStub = sinon.stub(User, 'concatenateTokenAndIp');
        hashEqualsSpy = sinon.spy(CryptoHelper, 'hashEquals');
        hashSpy = sinon.spy(CryptoHelper, 'hash');
        nowStub = sinon.stub(Date, 'now');
        throwStub = sinon.stub(ErrorMessage, 'throw');
        tokenValidityDaysStub = sinon.stub(User, 'tokenValidityDays');
    }

    function afterEachCallback() {
        concatenateTokenAndIpStub.restore();
        hashEqualsSpy.restore();
        hashSpy.restore();
        nowStub.restore();
        throwStub.restore();
        tokenValidityDaysStub.restore();
    }

    describe('assertAuthenticationMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throw() when authenticationMatches() returns false', () => {
            const authenticationMatchesStub = sinon.stub(user, 'authenticationMatches');
            authenticationMatchesStub.returns(false);

            user.assertAuthenticationMatches(authentication);

            expect(throwStub.calledOnceWith(`Authentication (${authentication}) is incorrect.`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
        });

        it('should do nothing when authenticationMatches() returns false', async () => {
            const authenticationMatchesStub = sinon.stub(user, 'authenticationMatches');
            authenticationMatchesStub.returns(true);

            user.assertAuthenticationMatches(authentication);
            expect(authenticationMatchesStub.calledOnceWith(authentication)).to.be.true;
            expect(throwStub.notCalled).to.be.true;
        });
    });

    describe('assertPasswordMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throw() when passwordMatches() returns false', () => {
            const passwordMatchesStub = sinon.stub(user, 'passwordMatches');
            passwordMatchesStub.returns(false);

            user.assertPasswordMatches(password);

            expect(throwStub.calledOnceWith(`Password for user (${user.email}) is incorrect.`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
        });

        it('should do nothing when passwordMatches() returns false', () => {
            const passwordMatchesStub = sinon.stub(user, 'passwordMatches');
            passwordMatchesStub.returns(true);

            user.assertPasswordMatches(password);
            expect(passwordMatchesStub.calledOnceWith(password)).to.be.true;
            expect(throwStub.notCalled).to.be.true;
        });
    });

    describe('assertRegistrationAuthenticated', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throw() when pendingRegistrationAuthentication() returns true', () => {
            const pendingRegistrationAuthenticationStub = sinon.stub(user, 'pendingRegistrationAuthentication');
            pendingRegistrationAuthenticationStub.returns(true);

            user.assertRegistrationAuthenticated();
            expect(throwStub.calledOnceWith(`User (${user.email}) has not yet authenticated their account.`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
        });

        it('should do nothing when pendingRegistrationAuthentication() returns false', () => {
            const pendingRegistrationAuthenticationStub = sinon.stub(user, 'pendingRegistrationAuthentication');
            pendingRegistrationAuthenticationStub.returns(false);

            user.assertRegistrationAuthenticated();
            expect(pendingRegistrationAuthenticationStub.calledOnceWith()).to.be.true;
            expect(throwStub.notCalled).to.be.true;
        });
    });

    describe('assertTokenAndIpMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throw() when tokenAndIpMatches() returns false', () => {
            const tokenAndIpMatchesStub = sinon.stub(user, 'tokenAndIpMatches');
            tokenAndIpMatchesStub.returns(false);

            user.assertTokenAndIpMatches(token, ip);
            expect(throwStub.calledOnceWith(`Invalid token and/or IP for user (${user.email}).`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
        });

        it('should do nothing when tokenAndIpMatches() returns true', () => {
            const tokenAndIpMatchesStub = sinon.stub(user, 'tokenAndIpMatches');
            tokenAndIpMatchesStub.returns(true);

            user.assertTokenAndIpMatches(token, ip);
            expect(tokenAndIpMatchesStub.calledOnceWith(token, ip)).to.be.true;
            expect(throwStub.notCalled).to.be.true;
        });
    });

    describe('assertTokenStillValid', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throw() when tokenStillValid() returns false', () => {
            const tokenStillValidStub = sinon.stub(user, 'tokenStillValid');
            tokenStillValidStub.returns(false);

            user.assertTokenStillValid();
            expect(throwStub.calledOnceWith(`User's (${user.email}) session is no longer valid.`, ErrorMessage.codes.UNAUTHORIZED));
        });

        it('should do nothing when tokenStillValid() returns true', () => {
            const tokenStillValidStub = sinon.stub(user, 'tokenStillValid');
            tokenStillValidStub.returns(true);

            user.assertTokenStillValid();
            expect(throwStub.notCalled).to.be.true;
        });
    });

    describe('authenticationMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.hashEquals()', () => {
            expect(user.authenticationMatches(authentication)).to.eql(hashEqualsSpy.returnValues[0]);
            expect(hashEqualsSpy.calledOnceWith(authentication.toLowerCase().trim(), user.salt, user.hashedAuthentication)).to.be.true;
        });
    });

    describe('hash', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.hash()', () => {
            expect(user.hash(plaintext)).to.eql(hashSpy.returnValues[0]);
            expect(hashSpy.calledOnceWith(plaintext, user.salt)).to.be.true;
        });
    });

    describe('passwordMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.hashEquals()', () => {
            expect(user.passwordMatches(plaintext)).to.eql(hashEqualsSpy.returnValues[0]);
            expect(hashEqualsSpy.calledOnceWith(plaintext, user.salt, user.hashedPassword));
        });
    });

    describe('pendingPasswordChangeAuthentication', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should return false when either hashedAuthentication or hashedNewPassword is null', () => {
            const nonNull = 'non-null';

            user.hashedAuthentication = null;
            user.hashedNewPassword = null;
            expect(user.pendingPasswordChangeAuthentication()).to.be.false;

            user.hashedAuthentication = nonNull;
            user.hashedNewPassword = null;
            expect(user.pendingPasswordChangeAuthentication()).to.be.false;

            user.hashedAuthentication = null;
            user.hashedNewPassword = nonNull;
            expect(user.pendingPasswordChangeAuthentication()).to.be.false;
        });

        it('should return true when hashedAuthentication and hashedNewPassword are non-null', () => {
            const nonNull = 'non-null';
            user.hashedAuthentication = nonNull;
            user.hashedNewPassword = nonNull;
            expect(user.pendingPasswordChangeAuthentication()).to.be.true;
        });
    });

    describe('pendingRegistrationAuthentication', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should return false when hashedAuthentication is null or hashedNewPassword is non-null', () => {
            const nonNull = 'non-null';

            user.hashedAuthentication = null;
            user.hashedNewPassword = nonNull;
            expect(user.pendingRegistrationAuthentication()).to.be.false;

            user.hashedAuthentication = null;
            user.hashedNewPassword = null;
            expect(user.pendingRegistrationAuthentication()).to.be.false;

            user.hashedAuthentication = nonNull;
            user.hashedNewPassword = nonNull;
            expect(user.pendingRegistrationAuthentication()).to.be.false;
        });

        it('should return true when hashedAuthentication is non-null and hashedNewPassword is null', () => {
            const nonNull = 'non-null';
            user.hashedAuthentication = nonNull;
            user.hashedNewPassword = null;
            expect(user.pendingRegistrationAuthentication()).to.be.true;
        });
    });

    describe('tokenAndIpMatches', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.hashEquals()', () => {
            concatenateTokenAndIpStub.returns(`${token}${ip}`);
            expect(user.tokenAndIpMatches(token, ip)).to.eql(hashEqualsSpy.returnValues[0]);
            expect(hashEqualsSpy.calledOnceWith(concatenateTokenAndIpStub.returnValues[0], user.salt, user.hashedTokenAndIp));
        });
    });

    describe('tokenStillValid', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should return false if tokenGeneratedTimestamp is null', () => {
            user.tokenGeneratedTimestamp = null;

            expect(user.tokenStillValid()).to.be.false;
        });

        it("should return false if tokenGeneratedTimestamp is more than 'User.tokenValidityDays()' days in the past", () => {
            nowStub.returns(10000);
            tokenValidityDaysStub.returns(5);

            const getTime = 10000 - 5 * 1000 * 60 * 60 * 24 - 1;

            user.tokenGeneratedTimestamp = getTime;

            expect(user.tokenStillValid()).to.be.false;
        });

        it("should return true if tokenGeneratedTimestamp is exactly 'User.tokenValidityDays()' in the past", () => {
            nowStub.returns(10000);
            tokenValidityDaysStub.returns(5);

            const getTime = 10000 - 5 * 1000 * 60 * 60 * 24;

            user.tokenGeneratedTimestamp = getTime;

            expect(user.tokenStillValid()).to.be.true;
        });

        it("should return true if tokenGeneratedTimestamp is less than 'User.tokenValidityDays()' in the past", () => {
            nowStub.returns(10000);
            tokenValidityDaysStub.returns(5);

            const getTime = 10000 - 5 * 1000 * 60 * 60 * 24 + 1;

            user.tokenGeneratedTimestamp = getTime;

            expect(user.tokenStillValid()).to.be.true;
        });
    });
});

describe('Saving', () => {
    const d = TestUtils.dataField;
    let userData = {};

    async function beforeEachCallback() {
        await User.deleteMany();
        userData[d] = getUserData();
    }

    describe('Errors', () => {
        describe('disabled', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForBoolean(User, userData, 'disabled');
        });

        describe('email', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'email');

            it('should reject with repeated email', async () => {
                await User.saveDoc(userData[d]);

                let saved = false;
                try {
                    await User.saveDoc(userData[d]);
                    saved = true;
                } catch (e) {

                }

                if (saved) throw 'Saved';
            });

            it('should reject with repeated email in different case', async () => {
                await User.saveDoc(userData[d]);

                userData[d].email = userData[d].email.toUpperCase();

                let saved = false;
                try {
                    await User.saveDoc(userData[d]);
                    saved = true;
                } catch (e) {

                }

                if (saved) throw 'Saved';
            });

            it('should reject with repeated email after trim', async () => {
                await User.saveDoc(userData[d]);

                userData[d].email = ` ${userData[d].email} `;

                let saved = false;
                try {
                    await User.saveDoc(userData[d]);
                    saved = true;
                } catch (e) {

                }

                if (saved) throw 'Saved';
            });
        });

        describe('firstName', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'firstName');
        });

        describe('hashedAuthentication', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForDefined(User, userData, 'hashedAuthentication');
        });

        describe('hashedNewPassword', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForDefined(User, userData, 'hashedNewPassword');
        });

        describe('hashedPassword', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'hashedPassword');
        });

        describe('hashedTokenAndIp', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForDefined(User, userData, 'hashedTokenAndIp');
        });

        describe('lastName', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'lastName');
        });

        describe('salt', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'salt');
        });

        describe('tokenGeneratedTimestamp', () => {
            beforeEach(beforeEachCallback);

            TestUtils.rejectionTestsForDefined(User, userData, 'tokenGeneratedTimestamp');
        });
    });

    describe('Successes', () => {
        beforeEach(beforeEachCallback);

        it('should save a User', async () => {
            const user = await User.saveDoc(userData[d]);

            expect(user.disabled).to.be.eql(userData[d].disabled);
            expect(user.email).to.be.eql(userData[d].email.toLowerCase().trim());
            expect(user.firstName).to.be.eql(userData[d].firstName);
            expect(user.hashedAuthentication).to.be.eql(userData[d].hashedAuthentication);
            expect(user.hashedNewPassword).to.be.eql(userData[d].hashedNewPassword);
            expect(user.hashedPassword).to.be.eql(userData[d].hashedPassword);
            expect(user.hashedTokenAndIp).to.be.eql(userData[d].hashedTokenAndIp);
            expect(user.lastName).to.be.eql(userData[d].lastName);
            expect(user.salt).to.be.eql(userData[d].salt);
        });
    });
});

describe('Static Methods', () => {
    const authCodeLength = 6;
    const authorization = 'theEmail:thePassword';
    const delimeter = ':';
    const email = 'some_email';
    const error = 'some error';
    const header = 'Authorization';
    const password = 'some password';
    const randomString = 'some_random_$tr1ng';
    const req = {
        header: () => null,
        ip: 'some ip'
    };
    const secureLength = 10;

    let authCodeLengthStub;
    let delimeterStub;
    let errorsStub;
    let findByEmailStub;
    let findOneStub;
    let generateRandomStringStub;
    let headerStub;
    let indexOfDelimeterStub;
    let parseAuthorizationHeaderStub;
    let parseEmailFromAuthorizationStub;
    let parseSecretFromAuthorizationStub;
    let reqHeaderStub;
    let secureLengthStub;
    let throwStub;
    let throwWithUserStub;
    let tokenValidityDaysStub;

    function beforeEachCallback() {
        authCodeLengthStub = sinon.stub(User, 'authCodeLength');
        delimeterStub = sinon.stub(User, 'delimeter');
        errorsStub = sinon.stub(User, 'errors');
        findByEmailStub = sinon.stub(User, 'findByEmail');
        findOneStub = sinon.stub(User, 'findOne');
        generateRandomStringStub = sinon.stub(CryptoHelper, 'generateRandomString');
        headerStub = sinon.stub(User, 'header');
        indexOfDelimeterStub = sinon.stub(User, 'indexOfDelimeter');
        parseAuthorizationHeaderStub = sinon.stub(User, 'parseAuthorizationHeader');
        parseEmailFromAuthorizationStub = sinon.stub(User, 'parseEmailFromAuthorization');
        parseSecretFromAuthorizationStub = sinon.stub(User, 'parseSecretFromAuthorization');
        reqHeaderStub = sinon.stub(req, 'header');
        secureLengthStub = sinon.stub(User, 'secureLength');
        throwStub = sinon.stub(ErrorMessage, 'throw');
        throwWithUserStub = sinon.stub(ErrorMessage, 'throwWithUser');
        tokenValidityDaysStub = sinon.stub(User, 'tokenValidityDays');
    }

    function afterEachCallback() {
        authCodeLengthStub.restore();
        delimeterStub.restore();
        errorsStub.restore();
        findByEmailStub.restore();
        findOneStub.restore();
        generateRandomStringStub.restore();
        headerStub.restore();
        indexOfDelimeterStub.restore();
        parseAuthorizationHeaderStub.restore();
        parseEmailFromAuthorizationStub.restore();
        parseSecretFromAuthorizationStub.restore();
        reqHeaderStub.restore();
        secureLengthStub.restore();
        throwStub.restore();
        throwWithUserStub.restore();
        tokenValidityDaysStub.restore();
    }

    describe('authCodeLength', () => {
        it('should return 6', () => {
            expect(User.authCodeLength()).to.eql(6);
        });
    });

    describe('authenticateLogin', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should reject when error thrown by User.parseAuthorizationHeader()', async () => {
            parseAuthorizationHeaderStub.throws(error);
            
            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.parseEmailFromAuthorization()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.throws(error);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.parseSecretFromAuthorization()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(null);
            parseSecretFromAuthorizationStub.throws(error);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.findByEmail()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.throws(error);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(parseEmailFromAuthorizationStub.returnValues[0])).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should call ErrorMessage.throw() when User.findByEmail() returns null', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.returns(null);
            throwStub.throws(error);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.calledOnceWith(`Email (${parseEmailFromAuthorizationStub.returnValues[0]}) does not exist.`, ErrorMessage.codes.NOT_FOUND)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should call ErrorMessage.throw() when User.findByEmail() returns a disabled user', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.returns({
                disabled: true
            });
            throwStub.throws(error);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.calledOnceWith(`User (${parseEmailFromAuthorizationStub.returnValues[0]}) is disabled.`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by assertPasswordMatches()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertPasswordMatches: (p) => null,
                assertRegistrationAuthenticated: () => null,
                disabled: false
            };
            const assertPasswordMatchesStub = sinon.stub(user, 'assertPasswordMatches');
            assertPasswordMatchesStub.throws(error);
            const assertRegistrationAuthenticatedSpy = sinon.spy(user, 'assertRegistrationAuthenticated');
            findByEmailStub.returns(user);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertPasswordMatchesStub.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0])).to.be.true;
            expect(assertRegistrationAuthenticatedSpy.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by assertRegistrationAuthenticated()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertPasswordMatches: (p) => null,
                assertRegistrationAuthenticated: () => null,
                disabled: false
            };
            const assertPasswordMatchesSpy = sinon.spy(user, 'assertPasswordMatches');
            const assertRegistrationAuthenticatedStub = sinon.stub(user, 'assertRegistrationAuthenticated');
            assertRegistrationAuthenticatedStub.throws(error);
            findByEmailStub.returns(user);

            let err;
            try {
                await User.authenticateLogin(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertPasswordMatchesSpy.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0])).to.be.true;
            expect(assertRegistrationAuthenticatedStub.calledOnceWith()).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should resolve when login is authenticated successfully', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertPasswordMatches: (p) => null,
                assertRegistrationAuthenticated: () => null,
                disabled: false
            };
            const assertPasswordMatchesSpy = sinon.spy(user, 'assertPasswordMatches');
            const assertRegistrationAuthenticatedSpy = sinon.spy(user, 'assertRegistrationAuthenticated');
            findByEmailStub.returns(user);

            const returned = await User.authenticateLogin(req);

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertPasswordMatchesSpy.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0])).to.be.true;
            expect(assertRegistrationAuthenticatedSpy.calledOnceWith()).to.be.true;
            expect(returned).to.eql(findByEmailStub.returnValues[0]);
        });
    });

    describe('authenticateRequest', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should reject when error thrown by User.parseAuthorizationHeader()', async () => {
            parseAuthorizationHeaderStub.throws(error);
            
            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.parseEmailFromAuthorization()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.throws(error);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.parseSecretFromAuthorization()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(null);
            parseSecretFromAuthorizationStub.throws(error);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by User.findByEmail()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.throws(error);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(parseEmailFromAuthorizationStub.returnValues[0])).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should call ErrorMessage.throw() when User.findByEmail() returns null', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.returns(null);
            throwStub.throws(error);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.calledOnceWith(`Email (${parseEmailFromAuthorizationStub.returnValues[0]}) does not exist.`, ErrorMessage.codes.NOT_FOUND)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should call ErrorMessage.throw() when User.findByEmail() returns a disabled user', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(null);
            findByEmailStub.returns({
                disabled: true
            });
            throwStub.throws(error);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.calledOnceWith(`User (${parseEmailFromAuthorizationStub.returnValues[0]}) is disabled.`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by assertTokenAndIpMatches()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertRegistrationAuthenticated: () => null,
                assertTokenAndIpMatches: (t, ip) => null,
                assertTokenStillValid: () => null,
                disabled: false
            };
            const assertRegistrationAuthenticatedSpy = sinon.spy(user, 'assertRegistrationAuthenticated');
            const assertTokenAndIpMatchesStub = sinon.stub(user, 'assertTokenAndIpMatches');
            assertTokenAndIpMatchesStub.throws(error);
            const assertTokenStillValidSpy = sinon.spy(user, 'assertTokenStillValid');
            findByEmailStub.returns(user);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertTokenAndIpMatchesStub.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0], req.ip)).to.be.true;
            expect(assertTokenStillValidSpy.notCalled).to.be.true;
            expect(assertRegistrationAuthenticatedSpy.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by assertTokenStillValid()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertRegistrationAuthenticated: () => null,
                assertTokenAndIpMatches: (t, ip) => null,
                assertTokenStillValid: () => null,
                disabled: false
            };
            const assertRegistrationAuthenticatedSpy = sinon.spy(user, 'assertRegistrationAuthenticated');
            const assertTokenAndIpMatchesSpy = sinon.spy(user, 'assertTokenAndIpMatches');
            const assertTokenStillValidStub = sinon.stub(user, 'assertTokenStillValid');
            assertTokenStillValidStub.throws(error);
            findByEmailStub.returns(user);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertTokenAndIpMatchesSpy.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0], req.ip)).to.be.true;
            expect(assertTokenStillValidStub.calledOnceWith()).to.be.true;
            expect(assertRegistrationAuthenticatedSpy.notCalled).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should reject when error thrown by assertRegistrationAuthenticated()', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertRegistrationAuthenticated: () => null,
                assertTokenAndIpMatches: (t, ip) => null,
                assertTokenStillValid: () => null,
                disabled: false
            };
            const assertRegistrationAuthenticatedStub = sinon.stub(user, 'assertRegistrationAuthenticated');
            assertRegistrationAuthenticatedStub.throws(error);
            const assertTokenAndIpMatchesSpy = sinon.spy(user, 'assertTokenAndIpMatches');
            const assertTokenStillValidSpy = sinon.spy(user, 'assertTokenStillValid');
            findByEmailStub.returns(user);

            let err;
            try {
                await User.authenticateRequest(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertTokenAndIpMatchesSpy.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0], req.ip)).to.be.true;
            expect(assertTokenStillValidSpy.calledOnceWith()).to.be.true;
            expect(assertRegistrationAuthenticatedStub.calledOnceWith()).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should resolve when request is authenticated successfully', async () => {
            parseAuthorizationHeaderStub.returns(authorization);
            parseEmailFromAuthorizationStub.returns(email);
            parseSecretFromAuthorizationStub.returns(password);
            const user = {
                assertRegistrationAuthenticated: () => null,
                assertTokenAndIpMatches: (t, ip) => null,
                assertTokenStillValid: () => null,
                disabled: false
            };
            const assertRegistrationAuthenticatedSpy = sinon.spy(user, 'assertRegistrationAuthenticated');
            const assertTokenAndIpMatchesSpy = sinon.spy(user, 'assertTokenAndIpMatches');
            const assertTokenStillValidSpy = sinon.spy(user, 'assertTokenStillValid');
            findByEmailStub.returns(user);

            const returned = await User.authenticateRequest(req);

            expect(parseAuthorizationHeaderStub.calledOnceWith(req)).to.be.true;
            expect(parseEmailFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(parseSecretFromAuthorizationStub.calledOnceWith(parseAuthorizationHeaderStub.returnValues[0])).to.be.true;
            expect(findByEmailStub.calledOnceWith(findByEmailStub.returnValues[0]));
            expect(throwStub.notCalled).to.be.true;
            expect(assertTokenAndIpMatchesSpy.calledOnceWith(parseSecretFromAuthorizationStub.returnValues[0], req.ip)).to.be.true;
            expect(assertTokenStillValidSpy.calledOnceWith()).to.be.true;
            expect(assertRegistrationAuthenticatedSpy.calledOnceWith()).to.be.true;
            expect(returned).to.eql(findByEmailStub.returnValues[0]);
        });
    });

    describe('concatenateTokenAndIp', () => {
        it('should concatenate the two strings', () => {
            const token = 'some_token';
            const ip = 'some_ip';
            const concatenated = `${token}${ip}`;
            expect(User.concatenateTokenAndIp(token, ip)).to.eql(concatenated);
        });
    });

    describe('delimeter', () => {
        it("should return ':'", () => {
            expect(User.delimeter()).to.eql(':');
        });
    });

    describe('errors', () => {
        it("should return the appropriate value for 'AUTHORIZATION_HEADER'", () => {
            errorsStub.restore();
            expect(User.errors().AUTHORIZATION_HEADER).to.eql('Invalid authorization header configuration');
        });

        it("should return the appropriate value for 'NOT_AUTHORIZED'", () => {
            errorsStub.restore();
            expect(User.errors().NOT_AUTHORIZED).to.eql('Not authorized');
        });
    });

    describe('findByEmail', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap User.findOne()', async () => {
            const trimFunc = () => 'trimmed_email';
            const toLowerCaseObject = {
                trim: trimFunc
            };
            const trimSpy = sinon.spy(toLowerCaseObject, 'trim');
            const emailObject = {
                toLowerCase: () => toLowerCaseObject
            };
            const toLowerCaseSpy = sinon.spy(emailObject, 'toLowerCase');

            findOneStub.returns('some user');
            findByEmailStub.restore();

            expect(await User.findByEmail(emailObject)).to.eql(await findOneStub.returnValues[0]);
            expect(findOneStub.calledOnceWith({ email: trimSpy.returnValues[0] })).to.be.true;
            expect(trimSpy.calledOnceWith()).to.be.true;
            expect(toLowerCaseSpy.calledOnceWith()).to.be.true;
        });
    });

    describe('header', () => {
        it("should return 'Authorization'", () => {
            headerStub.restore();
            expect(User.header()).to.eql('Authorization');
        });
    });

    describe('parseAuthorizationHeader', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throwWithUser() when req.header() returns undefined', () => {
            parseAuthorizationHeaderStub.restore();
            errorsStub.returns({
                AUTHORIZATION_HEADER: 'some message'
            });
            headerStub.returns(header);
            throwWithUserStub.throws(error);
            reqHeaderStub.returns(undefined);

            let err;
            try {
                User.parseAuthorizationHeader(req);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(throwWithUserStub.calledOnceWith(errorsStub.returnValues[0].AUTHORIZATION_HEADER, `Missing header: "${headerStub.returnValues[0]}"`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
            expect(reqHeaderStub.calledOnceWith(headerStub.returnValues[0])).to.be.true;
            expect(err.name).to.eql(error);
        });

        it('should wrap req.header()', () => {
            parseAuthorizationHeaderStub.restore();
            reqHeaderStub.returns('non-null');
            headerStub.returns(header);

            expect(User.parseAuthorizationHeader(req)).to.eql(reqHeaderStub.returnValues[0]);
            expect(throwWithUserStub.notCalled).to.be.true;
            expect(reqHeaderStub.calledOnceWith(headerStub.returnValues[0]));
        });
    });

    describe('generateAuthCode', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.generateRandomString()', () => {
            authCodeLengthStub.returns(authCodeLength);
            generateRandomStringStub.returns(randomString);

            expect(User.generateAuthCode()).to.eql(generateRandomStringStub.returnValues[0]);
            expect(generateRandomStringStub.calledOnceWith(authCodeLengthStub.returnValues[0])).to.be.true;
            expect(authCodeLengthStub.calledOnceWith()).to.be.true;
        });
    });

    describe('generateSalt', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.generateRandomString()', () => {
            generateRandomStringStub.returns(randomString);
            secureLengthStub.returns(secureLength);

            expect(User.generateSalt()).to.eql(generateRandomStringStub.returnValues[0]);
            expect(generateRandomStringStub.calledOnceWith(secureLengthStub.returnValues[0])).to.be.true;
            expect(secureLengthStub.calledOnceWith()).to.be.true;
        });
    });

    describe('generateToken', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should wrap CryptoHelper.generateRandomString()', () => {
            generateRandomStringStub.returns(randomString);
            secureLengthStub.returns(secureLength);

            expect(User.generateSalt()).to.eql(generateRandomStringStub.returnValues[0]);
            expect(generateRandomStringStub.calledOnceWith(secureLengthStub.returnValues[0])).to.be.true;
            expect(secureLengthStub.calledOnceWith()).to.be.true;
        });
    });

    describe('indexOfDelimeter', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should return the index of the delimeter in the string', () => {
            delimeterStub.returns(delimeter);
            indexOfDelimeterStub.restore();
            const authorization = {
                indexOf: (d) => 'some index'
            };
            const indexOfSpy = sinon.spy(authorization, 'indexOf');
    
            expect(User.indexOfDelimeter(authorization)).to.eql(indexOfSpy.returnValues[0]);
            expect(indexOfSpy.calledOnceWith(delimeterStub.returnValues[0])).to.be.true;
            expect(delimeterStub.calledOnceWith()).to.be.true;
        });
    });

    describe('parseEmailFromAuthorization', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throwWithUser() when User.indexOfDelimeter() returns a negative number', () => {
            parseEmailFromAuthorizationStub.restore();
            delimeterStub.returns(delimeter);
            errorsStub.returns({
                AUTHORIZATION_HEADER: 'some message'
            });
            headerStub.returns(header);
            indexOfDelimeterStub.returns(-1);
            throwWithUserStub.throws(error);

            let err;
            try {
                User.parseEmailFromAuthorization(authorization);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(throwWithUserStub.calledOnceWith(errorsStub.returnValues[0].AUTHORIZATION_HEADER, `Missing "${delimeterStub.returnValues[0]}" from "${headerStub.returnValues[0]}" header: "<email>${delimeterStub.returnValues[0]}<secret>"`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
            expect(indexOfDelimeterStub.calledOnceWith(authorization)).to.be.true;
        });

        it('should return the email parsed from the string when the delimeter is found', () => {
            parseEmailFromAuthorizationStub.restore();
            delimeterStub.returns(delimeter);
            errorsStub.returns({
                AUTHORIZATION_HEADER: 'some message'
            });
            headerStub.returns(header);
            const index = 5;
            indexOfDelimeterStub.returns(index);

            expect(User.parseEmailFromAuthorization(authorization)).to.eql(authorization.substring(0, index));
            expect(throwWithUserStub.notCalled).to.be.true;
        });
    });

    describe('parseSecretFromAuthorization', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should call ErrorMessage.throwWithUser() when User.indexOfDelimeter() returns a negative number', () => {
            parseSecretFromAuthorizationStub.restore();
            delimeterStub.returns(delimeter);
            errorsStub.returns({
                AUTHORIZATION_HEADER: 'some message'
            });
            headerStub.returns(header);
            indexOfDelimeterStub.returns(-1);
            throwWithUserStub.throws(error);

            let err;
            try {
                User.parseSecretFromAuthorization(authorization);
            } catch (e) {
                err = e;
            }

            if (err === undefined) throw TestUtils.errorNotThrownMessage;

            expect(throwWithUserStub.calledOnceWith(errorsStub.returnValues[0].AUTHORIZATION_HEADER, `Missing "${delimeterStub.returnValues[0]}" from "${headerStub.returnValues[0]}" header: "<email>${delimeterStub.returnValues[0]}<secret>"`, ErrorMessage.codes.UNAUTHORIZED)).to.be.true;
            expect(indexOfDelimeterStub.calledOnceWith(authorization)).to.be.true;
        });

        it('should return the secret parsed from the string when the delimeter is found', () => {
            parseSecretFromAuthorizationStub.restore();
            delimeterStub.returns(delimeter);
            errorsStub.returns({
                AUTHORIZATION_HEADER: 'some message'
            });
            headerStub.returns(header);
            const index = 5;
            indexOfDelimeterStub.returns(index);

            expect(User.parseSecretFromAuthorization(authorization)).to.eql(authorization.substring(index + delimeterStub.returnValues[0].length));
            expect(throwWithUserStub.notCalled).to.be.true;
        });
    });

    describe('secureLength', () => {
        it('should return 64', () => {
            expect(User.secureLength()).to.eql(64);
        });
    });

    describe('tokenValidityDays', () => {
        it('should return 7', () => {
            tokenValidityDaysStub.restore();
            expect(User.tokenValidityDays()).to.eql(7);
        });
    });

    describe('valueForHeader', () => {
        beforeEach(beforeEachCallback);
        afterEach(afterEachCallback);

        it('should concatenate the email, delimeter, and secret', () => {
            delimeterStub.returns(delimeter);

            expect(User.valueForHeader(email, password)).to.eql(`${email}${delimeter}${password}`);
        });
    });
});
