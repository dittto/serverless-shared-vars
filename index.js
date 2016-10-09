'use strict';

const FS = require('fs');

class SharedVars {
    constructor(serverless, options) {
        this.serverless = serverless;

        const logger = this.serverless.cli;
        const configPath = this.serverless.config.servicePath + '/';
        const configFile = '.shared-vars.js';
        const varContainer = this.serverless.service.custom;

        this.hooks = {
            'before:deploy:function:deploy': this.writeConfigFile.bind(null, logger, configPath, configFile, varContainer),
            'before:deploy:createDeploymentArtifacts': this.writeConfigFile.bind(null, logger, configPath, configFile, varContainer),
            'after:deploy:function:deploy': this.deleteConfigFile.bind(null, logger, configPath, configFile),
            'after:deploy:createDeploymentArtifacts': this.deleteConfigFile.bind(null, logger, configPath, configFile)
        };
    }

    writeConfigFile(logger, filePath, fileName, varContainer) {

        // create the template
        const vars = varContainer && varContainer.shared ? varContainer.shared : [];
        const template = '"use strict";' + "\n\n" +
            'module.exports = JSON.parse(\'' + JSON.stringify(vars) + '\');';

        // save the file
        FS.writeFile(filePath + fileName, template, error => {
            if (error) {
                throw error;
            }
            logger.log('Writing Shared vars file to ' + fileName);
        });
    }

    deleteConfigFile(logger, filePath, fileName) {
        FS.unlink(filePath + fileName, error => {
            if (error) {
                throw error;
            }
            logger.log('Removing Shared vars after zip created');
        });
    }

    static get() {
        try {
            if (require.resolve('.shared-vars')) {
                return require('.shared-vars');
            }
        } catch (e) {
            return [];
        }
    }
}

module.exports = SharedVars;
