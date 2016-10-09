'use strict';

module.exports = class {
    static Get() {

        try {
            if (require.resolve('.shared-vars')) {
                return require('.shared-vars');
            }
        } catch (e) {
            return [];
        }
    }
};
