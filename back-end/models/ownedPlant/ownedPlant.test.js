const { expect } = require('chai');
const OwnedPlant = require('./ownedPlant');
const TestUtils = require('../../utils/testUtils');
const User = require('../user/user');

let ownedPlantData = {};
const d = TestUtils.dataField;
let user;

async function resetData() {
    await OwnedPlant.deleteMany();
    await User.deleteMany();
    user = await User.saveDoc({
        disabled: false,
        email: 'something@something.com',
        firstName: 'John',
        hashedAuthentication: 'some hash',
        hashedPassword: 'some other hash',
        lastName: 'Jacob',
        salt: 'some salt'
    });
    ownedPlantData[d] = {
        _userId: user._id,
        amountWaterMl: 100,
        name: ' Cactus',
        wateringPeriodDays: 3
    };
}

describe('Saving', () => {
    describe('Errors', () => {
        describe('_userId', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForIdThatShouldExist(OwnedPlant, ownedPlantData, '_userId');
        });

        describe('amountWaterMl', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForRange(OwnedPlant, ownedPlantData, 'amountWaterMl', 0, null);
        });

        describe('name', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForNonEmptyString(OwnedPlant, ownedPlantData, 'name');

            it('should reject with repeated name for the same user', async () => {
                await OwnedPlant.saveDoc(ownedPlantData[d]);

                let saved = false;
                try {
                    await OwnedPlant.saveDoc(ownedPlantData[d]);
                    saved = true;
                } catch (e) { }

                if (saved) throw 'Saved';
            });

            it('should reject with repeated name in different case for the same user', async () => {
                await OwnedPlant.saveDoc(ownedPlantData[d]);

                ownedPlantData[d].name = ownedPlantData[d].name.toUpperCase();

                let saved = false;
                try {
                    await OwnedPlant.saveDoc(ownedPlantData[d]);
                    saved = true;
                } catch (e) { }

                if (saved) throw 'Saved';
            });

            it('should reject with repeated name after trim for the same user', async () => {
                await OwnedPlant.saveDoc(ownedPlantData[d]);

                ownedPlantData[d].name = ` ${ownedPlantData[d].name} `;

                let saved = false;
                try {
                    await OwnedPlant.saveDoc(ownedPlantData[d]);
                    saved = true;
                } catch (e) { }

                if (saved) throw 'Saved';
            });
        });

        describe('wateringPeriodDays', () => {
            beforeEach(resetData);

            TestUtils.rejectionTestsForRange(OwnedPlant, ownedPlantData, 'wateringPeriodDays', 1, null);
        });
    });

    describe('Successes', () => {
        beforeEach(resetData);

        it('should save an OwnedPlant', async () => {
            const ownedPlant = await OwnedPlant.saveDoc(ownedPlantData[d]);

            expect(ownedPlant._userId).to.be.eql(ownedPlantData[d]._userId);
            expect(ownedPlant.amountWaterMl).to.be.eql(ownedPlantData[d].amountWaterMl);
            expect(ownedPlant.name).to.be.eql(ownedPlantData[d].name.toLowerCase().trim());
            expect(ownedPlant.wateringPeriodDays).to.be.eql(ownedPlantData[d].wateringPeriodDays);
        });

        it('should save an OwnedPlant with the same name, for a different user', async () => {
            const ownedPlant = await OwnedPlant.saveDoc(ownedPlantData[d]);

            const otherUser = await User.saveDoc({
                disabled: false,
                email: 'somethingelse@something.com',
                firstName: 'John',
                hashedAuthentication: 'some hash',
                hashedPassword: 'some other hash',
                lastName: 'Jacob',
                salt: 'some salt'
            });

            const otherOwnedPlantData = { ...ownedPlantData[d] };
            otherOwnedPlantData._userId = otherUser._id;
            const otherOwnedPlant = await OwnedPlant.saveDoc(otherOwnedPlantData);
        });
    });
});
