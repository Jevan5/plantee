const { expect } = require('chai');
const TestUtils = require('../../utils/testUtils');
const User = require('./user');

let userData = {};
const d = TestUtils.dataField;

async function resetData() {
    await User.deleteMany();
    userData[d] = {
        disabled: false,
        email: ' test Email ',
        firstName: 'test firstName',
        hashedAuthentication: 'test hashedAuthentication',
        hashedPassword: 'test hashedPassword',
        lastName: 'test lastName',
        salt: 'test salt'
    };
}

describe('Saving', () => {
    describe('Errors', () => {
        describe('disabled', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForBoolean(User, userData, 'disabled');
        });

        describe('email', () => {
            beforeEach(resetData);

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
            beforeEach(resetData);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'firstName');
        });

        describe('hashedAuthentication', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForString(User, userData, 'hashedAuthentication');
        });

        describe('hashedPassword', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'hashedPassword');
        });

        describe('lastName', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'lastName');
        });

        describe('salt', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForNonEmptyString(User, userData, 'salt');
        });
    });

    describe('Successes', () => {
        beforeEach(resetData);

        it('should save a User', async () => {
            const user = await User.saveDoc(userData[d]);

            expect(user.disabled).to.be.eql(userData[d].disabled);
            expect(user.email).to.be.eql(userData[d].email.toLowerCase().trim());
            expect(user.firstName).to.be.eql(userData[d].firstName);
            expect(user.hashedAuthentication).to.be.eql(userData[d].hashedAuthentication);
            expect(user.hashedPassword).to.be.eql(userData[d].hashedPassword);
            expect(user.lastName).to.be.eql(userData[d].lastName);
            expect(user.salt).to.be.eql(userData[d].salt);
        });
    });
});
