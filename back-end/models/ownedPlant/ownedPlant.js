const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchemaValidator = require('../../utils/schemaValidator');
const User = require('../user/user');

const ownedPlantSchema = new Schema({
    _userId: { type: Schema.Types.ObjectId, index: 'hashed' },
    amountWaterMl: { type: Number, required: true, min: 0 },
    lastWatered: { type: Date, required: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    wateringPeriodDays: { type: Number, required: true, min: 1 }
});

ownedPlantSchema.index({ _userId: 1, name: 1 }, { unique: true });

ownedPlantSchema.pre('save', async function() {
    await SchemaValidator.assertIdExists('_userId', this._userId, User);
    await SchemaValidator.assertNotNull('amountWaterMl', this.amountWaterMl, User);
    this.amountWaterMl = Math.floor(this.amountWaterMl);
    await SchemaValidator.assertNotNull('wateringPeriodDays', this.wateringPeriodDays, User);
    this.wateringPeriodDays = Math.floor(this.wateringPeriodDays);
});

let OwnedPlant;

ownedPlantSchema.statics.saveDoc = async (doc) => {
    return new OwnedPlant(doc).save();
};

OwnedPlant = mongoose.model('OwnedPlant', ownedPlantSchema);

module.exports = OwnedPlant;
