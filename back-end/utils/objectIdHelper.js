const ErrorMessage = require('./errorMessage');
const User = require('../models/user/user');

class ObjectIdHelper {
    static assertIdMatches(id, otherId) {
        if (!ObjectIdHelper.idMatches(id, otherId)) ErrorMessage.throw(User.errors().NOT_AUTHORIZED, ErrorMessage.codes.UNAUTHORIZED);
    };

    static idMatches(id, otherId) {
        return id.toString().toLowerCase() === otherId.toString().toLowerCase();
    }
};

module.exports = ObjectIdHelper;
