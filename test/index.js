'use strict';

const expect = require('chai').expect;
const SharedVars = require('../index');
const localFS = require('fs');

class HooksTest extends SharedVars {
    writeConfigFile(FS, logger, filePath, sharedVars) {
        return sharedVars;
    }
}

describe('serverless-shared-vars', function () {

    beforeEach(function () {
        // write the config file
        const config = {
            cli: null,
            config: {servicePath: ''},
            service: {custom: ''}
        };
        this.shared = new SharedVars(config, []);

        // init logger
        this.logger = {
            loggerMessage: '',
            log: function(message) {this.loggerMessage = message;}
        };

        // init fake file store
        this.FS = {
            writeFilePath: null,
            writeFileTemplate: null,
            writeFileErrorResponse: null,

            writeFile: (path, template, callback) => {
                this.FS.writeFilePath = path;
                this.FS.writeFileTemplate = template;
                callback(this.FS.writeFileErrorResponse);
            },

            unlinkFilePath: null,
            unlinkErrorResponse: null,

            unlink: (path, callback) => {
                this.FS.unlinkFilePath = path;
                callback(this.FS.unlinkErrorResponse);
            }
        };
    });

    afterEach(function() {
        try {
            delete require.cache[require.resolve('../' + SharedVars.configFile)];
        } catch (e) {

        }
    });

    it('has before and after hooks', function () {
        expect(this.shared.hooks).to.have.property('before:invoke:local:invoke');
        expect(this.shared.hooks).to.have.property('before:deploy:resources');
        expect(this.shared.hooks).to.have.property('after:invoke:local:invoke');
        expect(this.shared.hooks).to.have.property('after:deploy:resources');
    });

    it('sends shared vars through the hooks', function () {
        const config = {
            cli: null,
            config: {servicePath: ''},
            service: {
                custom: {shared: {three: 'four'}}
            }
        };
        const shared = new HooksTest(config, []);

        expect(config.service.custom.shared).to.equal(shared.hooks['before:invoke:local:invoke']());
        expect(config.service.custom.shared).to.equal(shared.hooks['before:deploy:resources']());
    });

    it('writes a file based on shared values being set', function (done) {
        // init vars
        const shared = {
            one: 'two'
        };

        this.shared.writeConfigFile(this.FS, this.logger, '', shared).then(
            value => {
                try {
                    expect(this.FS.writeFilePath).to.equal(SharedVars.configFile);
                    expect(this.FS.writeFileTemplate).contains(JSON.stringify(shared));
                    expect(this.logger.loggerMessage).to.equal('Writing Shared vars file to .shared-vars.js');
                    return done();
                } catch (error) {
                    return done(error);
                }
            },
            errors => {
                return done(errors);
            }
        );
    });

    it('writes a file based on shared values not being set', function (done) {
        // remove any existing test
        this.shared.writeConfigFile(this.FS, this.logger, '', []).then(
            value => {
                try {
                    expect(this.FS.writeFileTemplate).contains(JSON.parse('[]'));
                    expect(this.logger.loggerMessage).to.equal('Writing Shared vars file to .shared-vars.js');
                    done();
                } catch (error) {
                    done(error);
                }
            },
            errors => {
                done(errors);
            }
        );
    });

    it('fails to write a file due to an error', function (done) {
        this.FS.writeFileErrorResponse = {errors: 'errors'};
        this.shared.writeConfigFile(this.FS, this.logger, '', []).then(
            value => {},
            errors => {
                expect(this.FS.writeFileErrorResponse).to.equal(errors);
                done();
            }
        );
    });

    it('deletes an existing file', function () {
        this.shared.deleteConfigFile(this.FS, this.logger, '');
        expect(this.logger.loggerMessage).to.equal('Removing Shared vars after zip created');
    });

    it('throws an error if one occurs when deleting files', function () {
        const errorMessage = {error: 'error'};
        this.FS.unlinkErrorResponse = new Error(errorMessage);
        expect(
            () => {
                this.shared.deleteConfigFile(this.FS, this.logger, '');
            }
        ).to.throw(errorMessage);
    });

    it('retrieves a config file when it exists', function (done) {
        const sharedVars = {one: 'two'};
        const template = '"use strict";' + "\n\n" +
            'module.exports = JSON.parse(\'' + JSON.stringify(sharedVars) + '\');';

        localFS.writeFile('./' + SharedVars.configFile, template, error => {
            expect(SharedVars.get()).to.deep.equal(sharedVars);
            done();
        });
    });

    it('returns nothing when the config file does not exist', function (done) {
        localFS.unlink('./' + SharedVars.configFile, error => {
            expect(SharedVars.get()).to.have.length(0);
            done();
        });
    });

    it('returns nothing if there is an error with the config file', function (done) {
        localFS.writeFile('./' + SharedVars.configFile, 'This will error', error => {
            expect(SharedVars.get()).to.have.length(0);
            done();
        });
    });
});


