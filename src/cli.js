#!/usr/bin/env node
'use strict'

const meow = require('meow')
const main = require('./index')
const colors = require('colors')

const cli = meow(`
  Usage
    $ jabbar [--repo|--org] <input> [--watchers|--stargazers]

  Options
    -o, --org     - Search all repos within this organisation
    -r, --repo    - Repository to search. Format: RichardLitt/jabbar
    -w, --watchers    - Get watchers for a repository
    -s, --stargazers  - Get stargazers for a repository
    -h, --help        - Show this printout

  Authentication
    This script looks for an auth token in the env var GITHUB_TOKEN. It needs
    to have the read:org scope in order to function properly. Make sure this
    var is set to a valid GitHub OAuth token.

  Examples
    $ jabbar --repo RichardLitt/jabbar --watchers

    # To pass an authentication token
    $ GITHUB_TOKEN=sd2991s jabbar -r RichardLitt/jabbar -w
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
    },
    help: {
      type: 'boolean',
      alias: 'h'
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

function printNames (arr) {
  let emptyOrgs = arr.filter(x => x.organizationsTotalCount === 0)
  arr.filter(x => x.organizationsTotalCount !== 0).forEach(x => {
    console.log(`${colors.green('@' + x.login)}${(x.name) ? ` (${x.name})` : ''}${(x.company) ? `. Works at ${colors.blue(x.company.trimEnd())}.` : ''}
Public organizations:
 ${colors.blue('-')} ${x.organizations.map(y => `${colors.magenta(y.name)} (@${y.login})`).join('\n - ')}
`)
  })
  if (emptyOrgs.length !== 0) {
    console.log(`And ${colors.green(emptyOrgs.length)} ${colors.green('other users')} with no org memberships.`)
  }
}

(async () => {
  if (cli.flags.o) {
    console.dir(await main.getOrgStargazers(cli.flags.o), { depth: null })
  } else if (cli.flags.r) {
    let [owner, repo] = cli.flags.r.split('/')
    if (cli.flags.w) {
      printNames(main.clean(await main.getWatchers(owner, repo), { depth: null }))
    } else if (cli.flags.s) {
      printNames(main.clean(await main.getStargazers(owner, repo), { depth: null }))
    } else if ((cli.flags.s && cli.flags.w) || (!cli.flags.w && !cli.flags.s)) {
      console.error(`You must specify either watchers or stargazers`)
      process.exit(1)
    }
  }
})()
