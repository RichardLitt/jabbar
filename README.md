# Jabbar

> Find out who is interested in your GitHub Code

## Background

> If a package maintainer uploads an open source package to a package manager, and no one sees it, does it make a sound?

Successful open source projects depend on their community for funding, interest, and long-term growth. Maintainers generally have to do a lot of leg-work themselves to make the package interesting, to attract more users, and to fund their own work. On GitHub, one way of tracking interest is to look at the contributors who have contributed code; or those who have opened issues; or those who have watched a repo; or, last, those who have starred a repository. There is some amount of information on GitHub in user profiles about interested users are and where they came from. Knowing that someone who starred your repo works for a company that may be able to sponsor continued work can be helpful for the maintainer.

This tool started as a simple idea: rather than manually looking through the people who star and watch repositories on GitHub, could we automatically get their affiliations?

*Jabbar* comes from *al jabbar*, meaning 'the giant' the medieval Arabic word for the constellation Orion. Look to the stars, eh? Any chance relation to the Gom Jabbar is purely not coincidental. (If you can think of a better name, [open an issue](https://github.com/RichardLitt/jabbar/issues/new).)

## Install

This package is on npm:

```sh
npm install jabbar
```

## Usage

Right now, running `node src/index.js` will print an empty console statement.

### CLI

_Most of this was lifted from [name-your-contributors](https://github.com/mntnr/name-your-contributors)._

```sh
> node src/cli.js --help
Index file is empty, but present.

  Find out who is interested in your code

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
```

### Testing

This module uses Mocha. To run the tests, run: `npm run test`.

## Contribute

Please do! This is an open source project. Check out the [Contributing Guide](CONTRIBUTING.md), which probably is a short read at the moment. [open issues](https://github.com/RichardLitt/jabbar/issues/new), submit PRs, or send get well soon cards.

Abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2019 Burnt Fen Creative LLC