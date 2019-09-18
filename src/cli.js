#!/usr/bin/env node
'use strict'

const meow = require('meow')
const main = require('./index')
// TODO Do these require more work on the `main` end?
const done = require('./graphql').done
const cache = require('./graphql').cache

const cli = meow(`
  Usage
    $ jabbar <input> [opts]

  Options
    -t, --token   - GitHub auth token to use
    -o, --org     - Search all repos within this organisation
    -r, --repo    - Repository to search
    -u, --user    - User to which repository belongs
    -c, --config  - Operate from config file. In this mode only token, verbose, and
                    debug flags apply.
    --csv         - Output data in CSV format
    --wipe-cache  - Wipe local cache before starting query.
    -v, --verbose - Enable verbose logging
    --debug       - Enable extremely verbose logging
    --dry-run     - Check the cost of the query without executing it.

  Authentication
    This script looks for an auth token in the env var GITHUB_TOKEN. It needs
    to have the read:org and the user:email scopes in order to function
    properly. Make sure this var is set to a valid GitHub oauth token. To
    create one see:
    https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/

  Examples
    $ jabbar -r jabbar -u RichardLitt
`, {
  flags: {
    config: {
      type: 'string',
      alias: 'c'
    },
    repo: {
      type: 'string',
      alias: 'r'
    },
    token: {
      type: 'string',
      alias: 't'
    },
    org: {
      type: 'string',
      alias: 'o'
    },
    user: {
      type: 'string',
      alias: 'u'
    },
    verbose: {
      type: 'boolean',
      alias: 'v'
    }
  }
})
// TODO The flags don't match up to the documentation.

const token = cli.flags.t || process.env.GITHUB_TOKEN

if (cli.flags.wipeCache) {
  if (cli.flags.v) {
    console.log('Wiping cache')
  }
  for (const key of cache.keysSync()) {
    cache.deleteSync(key)
  }
}

// TODO Annotate this
const defaultOpts = opts => {
  opts.token = token
  opts.debug = cli.flags.debug
  opts.dryRun = cli.flags.dryRun
  opts.verbose = cli.flags.v
  opts.commits = !cli.flags.localDir && cli.flags.commits

  return opts
}

if (!token && !cli.flags.c) {
  console.error('A token is needed to access the GitHub API. Please provide one with -t or the GITHUB_TOKEN environment variable.')
  process.exit(1)
}

const formatReturn = x => {
  if (cli.flags.csv) {
    return main.toCSV(x)
  } else {
    return JSON.stringify(x, null, 2)
  }
}

/** Wait for outstanding requests to resolve and shut down the program. */
const cleanup = ret => {
  if (done()) {
    process.exit(ret)
  } else {
    setTimeout(cleanup, 1000)
  }
}

const handleOut = res => {
  console.log(res)
  cleanup(0)
}

const handleError = e => {
  console.error(e)
  cleanup(1)
}

// TODO Not sure about the lines below here. They should be annotated better.
const handle = (f, opts) => f(opts).then(formatReturn).then(handleOut).catch(handleError)

const fetchRepo = (user, repo) => handle(main.repoContributors, defaultOpts({ user, repo }))

if (cli.flags.c) {
  const opts = defaultOpts({ file: cli.flags.c })
  main.fromConfig(opts)
    .then(x => JSON.stringify(x, null, 2))
    .then(handleOut)
    .catch(handleError)
} else if (cli.flags.o) {
  handle(main.orgContributors, defaultOpts({ orgName: cli.flags.o }))
} else if (cli.flags.u && cli.flags.r) {
  fetchRepo(cli.flags.u, cli.flags.r)
} else if (cli.flags.r) {
  main.currentUser(token).then(user => fetchRepo(user, cli.flags.r))
} else {
  main.getCurrentRepoInfo().then(({ user, repo }) => fetchRepo(user, repo))
}
