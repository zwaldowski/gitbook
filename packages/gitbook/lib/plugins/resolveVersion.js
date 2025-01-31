var npm = require('global-npm');
var semver = require('semver');
var Immutable = require('immutable');

var Promise = require('../utils/promise');
var Plugin = require('../models/plugin');
var gitbook = require('../gitbook');

/**
    Initialize and prepare NPM

    @return {Promise}
*/
function initNPM(options) {
    return Promise.nfcall(npm.load, {
        silent: true,
        loglevel: 'silent',
        ...options
    });
}

/**
    Resolve a plugin dependency to a version

    @param {PluginDependency} plugin
    @return {Promise<String>}
*/
function resolveVersion(plugin, options) {
    var npmId = Plugin.nameToNpmID(plugin.getName());
    var requiredVersion = plugin.getVersion();

    if (plugin.isGitDependency()) {
        return Promise.resolve(requiredVersion);
    }

    return initNPM(options)
        .then(function() {
            return Promise.nfcall(npm.commands.view, [npmId + '@' + requiredVersion, 'engines'], true);
        })
        .then(function(versions) {
            versions = Immutable.Map(versions).entrySeq();

            var result = versions
                .map(function(entry) {
                    return {
                        version: entry[0],
                        gitbook: (entry[1].engines || {}).gitbook
                    };
                })
                .filter(function(v) {
                    return v.gitbook && gitbook.satisfies(v.gitbook);
                })
                .sort(function(v1, v2) {
                    return semver.lt(v1.version, v2.version)? 1 : -1;
                })
                .get(0);

            if (!result) {
                return undefined;
            } else {
                return result.version;
            }
        });
}

module.exports = resolveVersion;
