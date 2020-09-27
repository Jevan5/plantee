const Auth = require('../../utils/auth');
const ErrorMessage = require('../../utils/errorMessage');
const express = require('express');
const router = express.Router();
const OwnedPlant = require('../../models/ownedPlant/ownedPlant');

router.route('/')
    .get(async (req, res) => {
        try {
            const user = await Auth.authenticateRequest(req);

            res.send({ ownedPlants: await OwnedPlant.find({ _userId: user._id }) });
        } catch (err) {
            res.status(500).send(err);
        }
    })
    .post(async (req, res) => {
        try {
            const user = await Auth.authenticateRequest(req);

            const ownedPlant = await OwnedPlant.saveDoc({
                _userId: user._id,
                amountWaterMl: req.body.ownedPlant.amountWaterMl,
                lastWatered: new Date(req.body.ownedPlant.lastWatered),
                name: req.body.ownedPlant.name,
                wateringPeriodDays: req.body.ownedPlant.wateringPeriodDays
            });

            res.send({ ownedPlant });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/:_ownedPlantId')
    .delete(async (req, res) => {
        try {
            const user = await Auth.authenticateRequest(req);

            let ownedPlant = await OwnedPlant.findById(req.params._ownedPlantId);
            if (ownedPlant === null) throw ErrorMessage.create(`Owned plant (${req.params._ownedPlantId}) does not exist.`, ErrorMessage.codes.NOT_FOUND);

            Auth.assertIdMatches(ownedPlant._userId, user._id);

            await OwnedPlant.findByIdAndDelete(req.params._ownedPlantId);

            res.send({ ownedPlant });
        } catch (err) {
            res.status(500).send(err);
        }
    })
    .put(async (req, res) => {
        try {
            const user = await Auth.authenticateRequest(req);

            let ownedPlant = await OwnedPlant.findById(req.params._ownedPlantId);
            if (ownedPlant === null) throw ErrorMessage.create(`Owned plant (${req.params._ownedPlantId}) does not exist.`, ErrorMessage.codes.NOT_FOUND);

            Auth.assertIdMatches(ownedPlant._userId, user._id);

            ownedPlant.amountWaterMl = req.body.ownedPlant.amountWaterMl;
            ownedPlant.lastWatered = new Date(req.body.ownedPlant.lastWatered);
            ownedPlant.name = req.body.ownedPlant.name;
            ownedPlant.wateringPeriodDays = req.body.ownedPlant.wateringPeriodDays;

            ownedPlant = await OwnedPlant.saveDoc(ownedPlant);

            res.send({ ownedPlant });
        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;
