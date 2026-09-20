# Contributing

**The issue tracker is only for bug reports. If you have a question or an enhancement suggestion, please post it in [GitHub Discussions](https://github.com/bleahbot/discord-player/discussions) instead of opening an issue.**

If you wish to contribute to @bleah/discord-player, feel free to fork the repository and submit a pull request.

## Setup

1. Fork & clone the repository, make sure you are on the correct branch
2. Run `npm ci`
3. Code your idea
4. Run `npm run lint` to run ESLint
5. [Submit a pull request](https://github.com/bleahbot/discord-player/pulls) (Make sure you follow the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/))

## Development tests

Use Node.js 22 or newer and install development dependencies with `npm ci --include=dev`.

```sh
npm test
npm run lint
```

`npm test` builds the library and explicitly runs the test files under `tests/`. It does not change `NODE_ENV` or add development checks to the library runtime.

The tests use Node's built-in test runner, mocked YouTube responses and simulated audio streams. They do not connect to Discord, download audio or require credentials. The existing `npm run test-ytdlp` command is a separate manual integration check that downloads audio.

Test files and helpers stay outside `src/` and `dist/`. They are excluded from the published npm package and are not loaded when an application imports the library. Installing or building the package does not run the test suite.

Match `.prettierrc` when adding tests: four-space indentation, double quotes, semicolons and no trailing commas. Document shared helper functions with JSDoc, following the source code's comment style.
