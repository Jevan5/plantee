class SchemaValidator {
    static assertDefined(field, value) {
        if (value === undefined) {
            throw ErrorMessage.createWithUser(`${field} (${value}) is undefined.`, `Missing ${field}.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }
    static assertNotNull(field, value) {
        SchemaValidator.assertDefined(field, value);

        if (value === null) {
            throw ErrorMessage.createWithUser(`${field} (${value}) is null.`, `Missing ${field}.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }

    static assertNonEmptyString(field, value) {
        SchemaValidator.assertNotNull(field, value);

        if (typeof(value) !== 'string' || value === '') {
            throw ErrorMessage.create(`${field} (${value}) is not a non-empty string.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }

    static async assertIdExists(field, value, collection) {
        SchemaValidator.assertNotNull(field, value);

        let doc;

        try {
            doc = await collection.findById(value);
        } catch (e) {
            throw ErrorMessage.createWithUser(`${field} (${value}) is not a valid ID.`, `Invalid ID: ${value}`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }

        if (doc === null) {
            throw ErrorMessage.create(`${field} (${value}) does not exist in ${collection.modelName}.`, ErrorMessage.codes.NOT_FOUND);
        }
    }

    static async assertIsOneOf(field, value, array) {
        SchemaValidator.assertNotNull(field, value);

        if (array.indexOf(value) < 0) {
            throw ErrorMessage.createWithUser(`${field} (${value}) is not in ${array.toString()}.`, `${field} must be one of ${array.toString()}.`, ErrorMessage.codes.NOT_FOUND);
        }
    }

    static assertNumber(field, value) {
        SchemaValidator.assertNotNull(field, value);

        if (typeof(value) !== 'number' || isNaN(value)) {
            throw ErrorMessage.create(`${field} (${value}) is not a number.`, ErrorMessage.codes.NOT_ACCEPTABLE);
        }
    }
}

module.exports = SchemaValidator;

const ErrorMessage = require('./errorMessage');
