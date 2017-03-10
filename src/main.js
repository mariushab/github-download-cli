const github = require('octonode');
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const logHelper = require('log-helper');
const downloadRepository = require('./../src/download');

module.exports = main;

function main(repositoryPath) {
    let client;
    if (program.username && program.password){
        client = github.client({
            username: program.username,
            password: program.password
        });
    } else if (program.accessToken){
        client = github.client(program.accessToken);
    } else {
        client = github.client();
    }
    const repository = client.repo(repositoryPath);
    checkRepository(repository, repositoryPath);
}

function checkRepository(repository, repositoryPath) {
    repository.info((error, body) => {
        if (error){
            logHelper.error(`The repository could not be found. If it's private, enter authorization information below`);
            co(handleInput(repositoryPath));
        } else {
            downloadRepository(repository);
        }
    });
}

function *handleInput(repositoryPath) {
    const selection = yield prompt('press 1 for username/password, 2 for access token and 3 to cancel: ');
    switch (selection) {
        case "1":
            const username = yield prompt('username: ');
            const password = yield prompt.password('password: ');
            checkRepository(github.client({
                username: username,
                password: password
            }).repo(repositoryPath), repositoryPath);
            break;
        case "2":
            const accessToken = yield prompt.password('access token: ');
            checkRepository(github.client(accessToken).repo(repositoryPath), repositoryPath);
            break;
        case "3":
            process.exit(1);
            break;
        default: co(handleInput(repositoryPath));
    }
}