# Project instructions

Follow the general project guidelines in @.github/copilot-instructions.md

# Issue workflow

- A merged change does not close its issue; the issue goes into testing first.
- In commit messages and pull request descriptions, never use GitHub's closing keywords
  (`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`)
  before an issue number. Reference the issue with `Refs #<number>` instead.
- After the change is merged, add the `testing` label to the issue and leave it open.
  The issue is closed only after it has been tested.
