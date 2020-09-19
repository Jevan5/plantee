const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchemaValidator = require('../../utils/schemaValidator');

const userSchema = new Schema({
    disabled: { type: Boolean, required: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    firstName: { type: String, required: true },
    hashedAuthentication: { type: String },
    hashedPassword: { type: String, required: true },
    lastName: { type: String, required: true },
    salt: { type: String, required: true }
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function() {
    SchemaValidator.assertNotNull('hashedAuthentication', this.hashedAuthentication);
});

let User;

userSchema.statics.saveDoc = async (doc) => {
    return new User(doc).save();
};

User = mongoose.model('User', userSchema);

module.exports = User;
