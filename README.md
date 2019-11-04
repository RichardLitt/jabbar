# Jabbar

> Find out who is interested in your GitHub code

A tool to find out more information about the people who watch or star your GitHub repository, and the organizations they work for.

**Table of Contents**

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [Programmatic](#programmatic)
  - [CLI](#cli)
  - [Testing](#testing)
- [API](#api)
  - [getWatchers(owner, repo)](#getwatchersowner-repo)
  - [getStargazers(owner, repo)](#getstargazersowner-repo)
- [Contribute](#contribute)
- [License](#license)

## Background

> If a package maintainer uploads an open source package to a package manager, and no one sees it, does it make a sound?

Successful open source projects depend on their community for funding, interest, and long-term growth. Maintainers generally have to do a lot of leg-work themselves to make the package interesting, to attract more users, and to fund their own work. On GitHub, one way of tracking interest is to look at the contributors who have contributed code; or those who have opened issues; or those who have watched a repo; or, last, those who have starred a repository. There is some amount of information on GitHub in user profiles about interested users are and where they came from. Knowing that someone who starred your repo works for a company that may be able to sponsor continued work can be helpful for the maintainer.

This tool started as a simple idea: rather than manually looking through the people who star and watch repositories on GitHub, could we automatically get their affiliations?

*Jabbar* comes from *al jabbar*, meaning 'the giant' the medieval Arabic word for the constellation [Orion](https://en.wikipedia.org/wiki/Orion_(constellation)). Look to the stars, eh? Any chance relation to the Gom Jabbar is purely not coincidental. (If you can think of a better name, [open an issue](https://github.com/RichardLitt/jabbar/issues/new).)

## Install

This package is on npm:

```sh
npm install jabbar
```

## Usage

### Authentication

This module looks for an auth token in the environmental variable `GITHUB_TOKEN`. It needs to have the read:org scope in order to function properly. Make sure this var is set to a valid GitHub OAuth token. To create one see [this article](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).

### Programmatic

```js
const j = require('jabbar')

// The main functions return a Promise.
async function promiseWrapper () {
  let response = await j.getWatchers('RichardLitt', 'jabbar')
  // This removes the .nodes from the response, which isn't totally necessary, but easier to deal with.
  let cleanerResponse = clean(response)
}

promiseWrapper()
```

Don't forget to set the `GITHUB_TOKEN` somewhere in your env.

### CLI

```
$ jabbar --help

  Usage
    $ jabbar <input> [--watchers|--stargazers]

  Options
    -r, --repo    - Repository to search. Format: RichardLitt/jabbar
                    This flag is used as the default input.
    -w, --watchers    - Get watchers for a repository
    -s, --stargazers  - Get stargazers for a repository
    -h, --help        - Show this printout
    --output <file>   - Print the results to a file as JSON

  Authentication
    This script looks for an auth token in the env var GITHUB_TOKEN. It needs
    to have the read:org scope in order to function properly. Make sure this
    var is set to a valid GitHub OAuth token.

  Examples
    $ jabbar RichardLitt/jabbar --watchers
    $ jabbar --repo RichardLitt/jabbar --watchers
    $ jabbar RichardLitt/jabbar -w --output=results.json

    # To pass an authentication token
    $ GITHUB_TOKEN=sd2991s jabbar -r RichardLitt/jabbar -w
```

### Testing

This module uses Mocha. To run the tests, run: `npm run test`.

## API

### getWatchers(owner, repo)

Get all of the watchers for a repository.

### getStargazers(owner, repo)

Get all of the stargazers for a repository.

## Contribute

Please do! This is an open source project. Check out the [Contributing Guide](CONTRIBUTING.md), which probably is a short read at the moment. [open issues](https://github.com/RichardLitt/jabbar/issues/new), submit PRs, or send get well soon cards.

Abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2019 Burnt Fen Creative LLC