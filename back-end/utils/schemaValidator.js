class SchemaValidator {
    static assertDefined(doc, field) {
        if (doc[field] === undefined) {
            ErrorMessage.throwWithUser(`${field} (${doc[field]}) is undefined.`, `Missing ${field}.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }
    static assertNotNull(doc, field) {
        SchemaValidator.assertDefined(doc, field);

        if (doc[field] === null) {
            ErrorMessage.throwWithUser(`${field} (${doc[field]}) is null.`, `Missing ${field}.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }

    static assertNonEmptyString(doc, field) {
        SchemaValidator.assertNotNull(doc, field);

        if (typeof(doc[field]) !== 'string' || doc[field] === '') {
            ErrorMessage.throw(`${field} (${doc[field]}) is not a non-empty string.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }

    static async assertIdExists(doc, field, model) {
        SchemaValidator.assertNotNull(doc, field);

        let otherDoc;

        try {
            otherDoc = await model.findById(doc[field]);
        } catch (e) {
            ErrorMessage.throwWithUser(`${field} (${doc[field]}) is not a valid ID.`, `Invalid ID: ${doc[field]}`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }

        if (otherDoc === null) {
            ErrorMessage.throw(`${field} (${doc[field]}) does not exist in ${collection.modelName}.`, ErrorMessage.codes.NOT_FOUND);
        }
    }

    static async assertIsOneOf(doc, field, array) {
        SchemaValidator.assertNotNull(doc, field);

        if (array.indexOf(doc[field]) < 0) {
            ErrorMessage.throwWithUser(`${field} (${doc[field]}) is not in ${array.toString()}.`, `${field} must be one of ${array.toString()}.`, ErrorMessage.codes.NOT_FOUND);
        }
    }

    static assertNumber(doc, field) {
        SchemaValidator.assertNotNull(doc, field);

        if (typeof(doc[field]) !== 'number' || isNaN(doc[field])) {
            ErrorMessage.throw(`${field} (${doc[field]}) is not a number.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }
}

module.exports = SchemaValidator;

const ErrorMessage = require('./errorMessage');
