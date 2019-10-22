#!/usr/bin/env node
'use strict'

const meow = require('meow')
const main = require('./index')

const cli = meow(`
  Usage
    $ jabbar <input> [opts]

  Options
    -o, --org     - Search all repos within this organisation
    -r, --repo    - Repository to search. Format: RichardLitt/jabbar
    -w, --watchers    - Get watchers for a repository
    -s, --stargazers  - Get stargazers for a repository

  Authentication
    This script looks for an auth token in the env var GITHUB_TOKEN. It needs
    to have the read:org and the user:email scopes in order to function
    properly. Make sure this var is set to a valid GitHub oauth token. To
    create one see:
    https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/

  Examples
    $ jabbar --repo RichardLitt/jabbar

    # To pass an authentication token:
    $ GITHUB_TOKEN=sdajfsl jabbar --repo RichardLitt/jabbar
`, {
  flags: {
    repo: {
      type: 'string',
      alias: 'r'
    },
    org: {
      type: 'string',
      alias: 'o'
    },
    watchers: {
      type: 'boolean',
      alias: 'w'
    },
    stargazers: {
      type: 'boolean',
      alias: 's'
    }
  }
})

const token = process.env.GITHUB_TOKEN

if (cli.flags.r.split('/').length !== 2) {
  console.error(`The --repo flag requires the format: 'owner/repo'.`)
  process.exit(1)
}

if (!token) {
  console.error(`A token is needed to access the GitHub API.
Please provide one with the GITHUB_TOKEN environment variable.`)
  process.exit(1)
}

let callPromises = async function () {
  if (cli.flags.o) {
    console.dir(await main.getOrgStargazers(cli.flags.o), {depth: null})
  } else if (cli.flags.r) {
    let [owner, repo] = cli.flags.r.split('/')
    if (cli.flags.w) {
      console.dir(await main.getWatchers(owner, repo), {depth: null})
    } else if (cli.flags.s) {
      console.dir(await main.getStargazers(owner, repo), {depth: null})
    } else if (cli.flags.s && cli.flags.w || !cli.flags.w && !cli.flags.s) {
      console.error(`You must specify either watchers or stargazers`)
      process.exit(1)
    }
  }
}

callPromises()
