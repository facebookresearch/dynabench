# Contributing to dynabench
We want to make contributing to this project as easy and transparent as
possible.

## Pull Requests
We actively welcome your pull requests.

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").

## Coding Style
* In your editor, install the [editorconfig](https://editorconfig.org/) extension which should ensure that you are following the same standards as us.
* Dynabench uses pre-commit hooks to ensure style consistency and prevent common mistakes. Enable it by:

```sh
pip install pre-commit && pre-commit install
```

After this pre-commit hooks will be run before every commit.

* Read the [editorconfig](https://github.com/facebookresearch/dynabench/blob/master/.editorconfig) file to understand the exact coding style preferences.

* Ideally, black and isort should be run via pre-commit hooks.
But if for some reason you want to run black and isort separately follow this:

```
pip install black==19.3b0 isort==4.3.21
black ./(mmf|tests|tools)/**/*.py
isort -rc (mmf|tests|tools)
```

## Contributor License Agreement ("CLA")
In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

## Issues
We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue.

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe
disclosure of security bugs. In those cases, please go through the process
outlined on that page and do not file a public issue.

## License
By contributing to dynabench, you agree that your contributions will be licensed
under the LICENSE file in the root directory of this source tree.
