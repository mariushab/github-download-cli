const logHelper = require('log-helper');
const download = require('download');
const fs = require('fs-promise');
const exec = require('child_process').exec;
const program = require('commander');
const decompress = require('decompress');
const ProgressBar = require('progress');

module.exports = downloadRepository;

function downloadRepository(repository) {
    const repositoryName = repository.name.substr(repository.name.indexOf('/') + 1);
    fs.remove(repositoryName).then(() => {
        return getZIPLink(repository)
    }).then((link) => {
        logHelper.status(`Starting the download of ${repositoryName}`);
        const bar = new ProgressBar('[:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: 0
        });
        return download(link).on('response', (response) => {
            bar.total = response.headers['content-length'];
            response.on('data', (data) => {
                try {
                    bar.tick(data.length);
                } catch (error) {}
            });
        });
    }).then((data) => {
        logHelper.status(`Decompressing the zip file`);
        return decompress(data, repositoryName, {strip: 1});
    }).then(() => {
        return checkIfDependenciesNeedToBeInstalled(repositoryName);
    }).then(() => {
        logHelper.success(`${repositoryName} downloaded successfully`);
        process.exit(1);
    }).catch((error) => {
        logHelper.error(error);
    });
}

function getZIPLink(repository) {
    return new Promise((resolve, reject) => {
        repository.archive('zipball', (error, body) => {
            error ? reject(error) : resolve(body);
        });
    });
}

function checkIfDependenciesNeedToBeInstalled(repositoryName) {
    const packageManagers = [{
        file: 'package.json',
        flag: 'installNPM',
        command: 'npm i'
    }, {
        file: 'bower.json',
        flag: 'installBower',
        command: 'bower install'
    }];
    const promises = [];
    packageManagers.forEach((packageManager) => {
        promises.push(handlePackageManager(packageManager, repositoryName));
    });
    return Promise.all(promises);
}

function handlePackageManager(packageManager, repositoryName) {
    if (program[packageManager.flag]){
        return new Promise((resolve, reject) => {
            fs.exists(`${repositoryName}/${packageManager.file}`).then((exists) => {
                if (exists){
                    installDependencies(repositoryName, packageManager.command).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    } else {
        return Promise.resolve();
    }
}

function installDependencies(repositoryName, command) {
    logHelper.status(`Executing ${command}`);
    return new Promise((resolve, reject) => {
        exec(command, {cwd: repositoryName}, (error) => {
            error ? reject(error) : resolve();
        });
    });
}