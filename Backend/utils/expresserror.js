class expresserror extends Error {
    constructor(message, statusCode) {
        super();

        this.message = message;
        this.statusCode = statusCode;
    }
};
module.exports = expresserror;