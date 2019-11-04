#!/usr/bin/env node
'use strict'

const meow = require('meow')
const main = require('./index')
const colors = require('colors')
const fs = require('fs')
const moment = require('moment')

const cli = meow(`
  Usage
    $ jabbar <input> [--watchers|--stargazers]

  Options
    -r, --repo    - Repository to search. Format: RichardLitt/jabbar
                    This flag is used as the default input.
    --all         - The default: get all watchers, stargazers, and forkers
    -w, --watchers    - Get watchers for a repository
    -s, --stargazers  - Get stargazers for a repository
    -f, --forkers     - Get forkers for a repository
    -h, --help        - Show this printout
    --output <file>   - Print the results to a file as JSON

  Authentication
    This script looks for an auth token in the env var GITHUB_TOKEN. It needs
    to have the read:org scope in order to function properly. Make sure this
    var is set to a valid GitHub OAuth token.

  Examples
    $ jabbar RichardLitt/jabbar
    $ jabbar --repo RichardLitt/jabbar --watchers
    $ jabbar RichardLitt/jabbar -w --output=results.json

    # To pass an authentication token
    $ GITHUB_TOKEN=sd2991s jabbar -r RichardLitt/jabbar -w
`, {
  flags: {
    repo: {
      type: 'string',
      alias: 'r'
    },
    watchers: {
      type: 'boolean',
      alias: 'w'
    },
    stargazers: {
      type: 'boolean',
      alias: 's'
    },
    forkers: {
      type: 'boolean',
      alias: 'f'
    },
    help: {
      type: 'boolean',
      alias: 'h'
    },
    output: {
      type: 'string'
    }
  }
})

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error(`A token is needed to access the GitHub API.
Please provide one with the GITHUB_TOKEN environment variable.`)
  process.exit(1)
}

// Validate repository name inputs
// Specify that the default flag is the repo flag
if (cli.input[0] && !cli.flags.r) {
  cli.flags.r = cli.input[0]
} else if (cli.input.length === 0 && !cli.flags.r) {
  console.error(`You must specify a repository to query.`)
  process.exit(1)
}
// Note: this doesn't validate for more arcane errors, like Ric.ardLitt/10*sk.
cli.flags.r = cli.flags.r.split('/')
if (cli.flags.r.length !== 2) {
  console.error(`The repository must be specified in the format: 'owner/repo'.`)
  process.exit(1)
}

async function printNames (arr) {
  // Print to a file
  if (cli.flags.output) {
    if (!cli.flags.output.endsWith('.json')) {
      cli.flags.output = cli.flags.output + '.json'
    }
    await fs.writeFileSync(cli.flags.output, JSON.stringify(arr, null, 2), 'utf8', (err) => {
      if (err) throw err; console.log('There was an error saving the file.')
      process.exit(1)
    })
    console.log(`The file has been saved to ${cli.flags.output}.`)
    process.exit(0)
  }

  // Print to the CLI
  let emptyOrgs = arr.filter(x => x.organizationsTotalCount === 0)
  let readableDate = 'YYYY MMMM Do, h:mma'
  arr.filter(x => x.organizationsTotalCount !== 0).forEach(x => {
    console.log(`${colors.green('@' + x.login)}${(x.name) ? ` (${x.name})` : ''}${(x.company) ? `. Works at ${colors.blue(x.company.trimEnd())}.` : ''}`)
    if (x.starredAt) { console.log(`Starred on: ${moment(x.starredAt).format(readableDate)}`) }
    if (x.forkedAt) { console.log(`Forked on: ${moment(x.starredAt).format(readableDate)}`) }
    console.log(`Public organizations:
 ${colors.blue('-')} ${x.organizations.map(y => `${colors.magenta(y.name)} (@${y.login})`).join('\n - ')}
`)
  })
  if (emptyOrgs.length !== 0) {
    let companyOnly = emptyOrgs.filter(x => x.company)
    if (companyOnly.length !== 0) {
      console.log(`And these users with only stated companies, but no public orgs:`)
      companyOnly.forEach(x => {
        console.log(`${colors.green('@' + x.login)}${(x.name) ? ` (${x.name})` : ''}. Works at ${colors.blue(x.company.trimEnd())}.`)
      })
      console.log(``) // Newline
    }
    let emptyAll = emptyOrgs.filter(x => !x.company)
    if (emptyAll.length !== 0) {
      console.log(`And ${colors.green(emptyAll.length)} ${colors.green('other users')} with no public org memberships or stated companies.`)
    }
  }
}

(async () => {
  let [owner, repo] = cli.flags.r
  if (cli.flags.w) {
    printNames(await main.getWatchers(owner, repo))
  } else if (cli.flags.f) {
    printNames(await main.getForkers(owner, repo))
  } else if (cli.flags.s) {
    printNames(await main.getStargazers(owner, repo))
  } else {
    printNames(await main.getAllUsers(owner, repo))
  }
})()
