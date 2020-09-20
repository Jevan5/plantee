class Environment {
    static modeEnum = {
        DEV: 'dev',
        PROD: 'prod',
        TEST: 'test'
    };

    constructor(mode, apiPort, apiUrl, mongoPort, mongoUrl) {
        this.mode = mode;
        this.api = {
            port: apiPort,
            url: apiUrl
        };
        this.mongo = {
            port: mongoPort,
            url: mongoUrl
        };
        this.db = `plantee-${this.mode}`;
    }
}

let environment;

switch (process.argv[2]) {
case Environment.modeEnum.DEV:
    environment = new Environment(Environment.modeEnum.DEV, 8021, 'http://localhost', 27017, 'mongodb://localhost');
    break;
case Environment.modeEnum.PROD:
    environment = new Environment(Environment.modeEnum.PROD, 443, 'https://54.243.37.200', 27017, 'mongodb://localhost');
    break;
case Environment.modeEnum.TEST:
    environment = new Environment(Environment.modeEnum.TEST, 8025, 'http://localhost', 27017, 'mongodb://localhost');
    break;
default:
    console.log(`${process.argv[2]} is not "${Environment.modeEnum.DEV}", "${Environment.modeEnum.PROD}", or "${Environment.modeEnum.TEST}"`);
    process.exit();
}

module.exports = {
    Environment,
    environment
};
