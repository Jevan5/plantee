import Document from './document';

export default class OwnedPlant extends Document {
  static readonly nameForSingle = 'ownedPlant';
  static readonly routeName = 'ownedPlants';

  static daysDifference(earlier: Date, later: Date): number {
    const msInADay = 1000 * 60 * 60 * 24;
    const earlierDay = Math.floor(earlier.valueOf() / msInADay);
    const laterDay = Math.floor(later.valueOf() / msInADay);

    return laterDay - earlierDay;
  }

  static daysUntilNextWatering(ownedPlant: OwnedPlant): number {
    return ownedPlant.wateringPeriodDays - OwnedPlant.daysDifference(ownedPlant.lastWatered, new Date());
  }

  constructor(doc = {}) {
    super();

    Object.keys(doc).forEach((key) => {
      if (key === 'lastWatered') {
        this[key] = new Date(doc[key]);
      } else {
        this[key] = doc[key];
      }
    });
  }

  public _userId: string;
  public amountWaterMl: number;
  public lastWatered: Date;
  public name: string;
  public wateringPeriodDays: number;
}
