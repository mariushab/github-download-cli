#!/usr/bin/env node
const program = require('commander');
const main = require('./src/main');

program
    .arguments('<repositoryPath>', 'The path to the repository, consting of the username/organization name and the package name')
    .option('-u, --username <username>', 'Your github username (optional)')
    .option('-p, --password <password>', 'Your github password (optional)')
    .option('-a, --accessToken <accessToken>', 'Your personal github access token')
    .option('--installNPM', 'Use this flag to let install npm the projects dependencies, if the repository contains a package.json')
    .option('--installBower', 'Use this flag to let install bower the projects dependencies, if the repository contains a bower.json')
    .action(main)
    .parse(process.argv);