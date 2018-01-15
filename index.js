'use strict';

class SharedVars {
    constructor(serverless, options) {
        this.serverless = serverless;
        const FS = require('fs');
        const logger = this.serverless.cli;
        const configPath = this.serverless.config.servicePath + '/node_modules/';
        const varContainer = this.serverless.service.custom;
        const sharedVars = varContainer && varContainer.shared ? varContainer.shared : [];

        // https://serverless.com/framework/docs/providers/google/guide/plugins/#hooks for general docs
        // https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406 for list of hooks. All hooks can have before: and after:
        this.hooks = {
            'before:invoke:local:invoke': this.writeConfigFile.bind(null, FS, logger, configPath, sharedVars),
            'before:deploy:function:deploy': this.writeConfigFile.bind(null, FS, logger, configPath, sharedVars),
            'before:package:createDeploymentArtifacts': this.writeConfigFile.bind(null, FS, logger, configPath, sharedVars),

            'after:invoke:local:invoke': this.deleteConfigFile.bind(null, FS, logger, configPath),
            'after:deploy:function:deploy': this.deleteConfigFile.bind(null, FS, logger, configPath),
            'after:package:createDeploymentArtifacts': this.deleteConfigFile.bind(null, FS, logger, configPath)
        };
    }

    static get configFile() {
        return '.shared-vars.js';
    }

    writeConfigFile(FS, logger, filePath, sharedVars) {
        // create the template
        const template = '"use strict";' + "\n\n" +
            'module.exports = JSON.parse(\'' + JSON.stringify(sharedVars) + '\');';

        // save the file
        return new Promise((resolve, reject) => {
            FS.writeFile(filePath + SharedVars.configFile, template, error => {
                if (error) {
                    reject(error);
                }
                logger.log('Writing Shared vars file to ' + SharedVars.configFile);
                resolve();
            });
        });
    }

    deleteConfigFile(FS, logger, filePath) {
        FS.unlink(filePath + SharedVars.configFile, error => {
            if (error) {
                throw error;
            }
            logger.log('Removing Shared vars after zip created');
        });
    }

    static get() {
        try {
            return require(SharedVars.configFile);
        } catch (e) {}
        try {
            return require('./' + SharedVars.configFile);
        } catch (e) {}
        try {
            return require('../' + SharedVars.configFile);
        } catch (e) {}
        try {
            return require('../../' + SharedVars.configFile);
        } catch (e) {}

        return [];
    }
}

module.exports = SharedVars;
