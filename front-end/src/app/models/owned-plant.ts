import Document from './document';

export default class OwnedPlant extends Document {
    static readonly nameForSingle = 'ownedPlant';
    static readonly nameForMultiple = 'ownedPlants';

    public _userId: string;
    public amountWaterMl: number;
    public name: string;
    public wateringPeriodDays: number;
}
