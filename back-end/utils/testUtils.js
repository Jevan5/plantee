const mongoose = require('mongoose');

class TestUtils {
    static get dataField() {
        return 'data';
    }

    static rejectionTestsForDefined(model, baseData, field) {
        it(`should reject with undefined ${field}`, async () => {
            baseData[TestUtils.dataField][field] = undefined;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForNonNull(model, baseData, field) {
        TestUtils.rejectionTestsForDefined(model, baseData, field);

        it(`should reject with null ${field}`, async () => {
            baseData[TestUtils.dataField][field] = null;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForBoolean(model, baseData, field) {
        TestUtils.rejectionTestsForNonNull(model, baseData, field);

        it(`should reject with non-boolean ${field}`, async () => {
            baseData[TestUtils.dataField][field] = 10;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForDate(model, baseData, field) {
        TestUtils.rejectionTestsForNonNull(model, baseData, field);

        it(`should reject with non-date ${field}`, async () => {
            baseData[TestUtils.dataField][field] = 'not a date';

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForNumber(model, baseData, field) {
        TestUtils.rejectionTestsForNonNull(model, baseData, field);

        it(`should reject with non-numeric ${field}`, async () => {
            baseData[TestUtils.dataField][field] = 'not a number';

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });

        it(`should reject with NaN ${field}`, async () => {
            baseData[TestUtils.dataField][field] = NaN;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForRange(model, baseData, field, min, max) {
        TestUtils.rejectionTestsForNumber(model, baseData, field);

        if (min !== null) {
            it(`should reject with ${field} less than ${min}`, async () => {
                baseData[TestUtils.dataField][field] = min - 1;

                let saved = false;
                try {
                    await model.saveDoc(baseData[TestUtils.dataField]);
                    saved = true;
                } catch (e) { }

                if (saved) throw 'Saved';
            });
        }

        if (max !== null) {
            it(`should reject with ${field} more than ${max}`, async () => {
                baseData[TestUtils.dataField][field] = max + 1;

                let saved = false;
                try {
                    await model.saveDoc(baseData[TestUtils.dataField]);
                    saved = true;
                } catch (e) { }

                if (saved) throw 'Saved';
            });
        }
    }

    static rejectionTestsForString(model, baseData, field) {
        TestUtils.rejectionTestsForNonNull(model, baseData, field);

        it(`should reject with non-string ${field}`, async () => {
            baseData[TestUtils.dataField][field] = {};

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForNonEmptyString(model, baseData, field) {
        TestUtils.rejectionTestsForString(model, baseData, field);

        it(`should reject with empty-string ${field}`, async () => {
            baseData[TestUtils.dataField][field] = '';

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }

    static rejectionTestsForIdThatShouldExist(model, baseData, field) {
        it(`should reject with undefined ID: ${field}`, async () => {
            baseData[TestUtils.dataField][field] = undefined;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });

        it(`should reject with null ID: ${field}`, async () => {
            baseData[TestUtils.dataField][field] = null;

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });

        it(`should reject with invalid ID field: ${field}`, async () => {
            baseData[TestUtils.dataField][field] = '123';

            let saved = false;
            try {
                await model.saveDoc(baseData[TestUtils.dataField]);
                saved = true;
            } catch (e) { }

            if (saved) throw 'Saved';
        });
    }
}

module.exports = TestUtils;
