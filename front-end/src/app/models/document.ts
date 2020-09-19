export default abstract class Document {
    static readonly nameForSingle: string;
    static readonly nameForMultiple: string;

    public _id: string;
    public __v: number;

    constructor(doc = {}) {
        Object.keys(doc).forEach((key) => {
            this[key] = doc[key];
        });
    }
};