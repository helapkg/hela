# Security Policy

Outlined in this document are the practices and policies that we applies to help
ensure that we release stable & secure software, and react appropriately to
security threats when they arise.

## Reporting a Vulnerability

Let’s keep things simple.

If you think you have identified a security vulnerability with any module or
repository, please report it immediately to [**security@tunnckocore.com**](#).
If you are not sure, don’t worry. Better safe than sorry – just send an email.
Do not open issues related to any security concerns publicly. Please do not
include anyone else on the disclosure email.

When reporting a security issue, include as much information as possible, but no
need to fill fancy forms or answer tedious questions. Just tell us what you
found, how to reproduce it, and any concerns you have about it. We will respond
as soon as possible and follow up.

## Disclosure Policy

We report all identified security issues to the
[npm Security Team](https://www.npmjs.com/policies/security) or
[Tidelift Security](https://tidelift.com/security) as soon as an issue has been
confirmed and we work closely to issue responsible disclosures. You can also
contact [**security@npmjs.com**](#) directly and mention our security email or
include us in the `Cc` field. When issues are disclosed, the person or team
responsible for the discovery receives full credit. Public disclosures are made
after the issue has been fully identified and a patch is ready to be released.

_Please DO NOT contact [**security@tidelift.com**](#) directly if there is no
Tidelift Subscription available for a module! Contact them only for reporting
about security vulnerability of specific module that has subscription
available!_

Companies or individuals that are active subscribers through **Tidelift
Subscription**, [GitHub Sponsors](https://github.com/sponsors/tunnckoCore),
[Patreon Patrons](https://patreon.com/tunnckoCore) or
[Ko-fi Subcribers](https://ko-fi.com/tunnckoCore) will receive advance notice of
upcoming security disclosures and patches up to 24-72 hours prior to public
disclosure.

### Advance security notifications

| Platform | Hours advance |
| -------- | ------------- |
| Ko-fi    | 24 hours      |
| GitHub   | 48 hours      |
| Tidelift | 48 hours      |
| Patreon  | 72 hours      |

## Development Process

We have a well-defined, security-focused, high quality development process:

### Code Reviews

No code goes into production unless it is reviewed by at least one other
developer.

The onus is on the reviewer to ask hard questions: "what are the ramifications
of opening up port-X?", "why is this connection being made over HTTP instead of
HTTPS?"

### Deploying Updates

Any new code pushed to production is first thoroughly tested in a staging
environment. Mechanisms are in place for rolling back any changes that are
pushed to production. If a schema-change is involved, an inverse migration is
first tested in staging (we want to be confident that we should role things
back).

### Unit Testing

We love testing and use best in class tools and practices.

- During the code-review process, if you see logic that's complicated and lacks
  a test, politely ask the contributor for a test.
- Tests should not contain user-data: anonymize email addresses, usernames, etc.
- High test coverage is a great way to make sure your codebase is stable.
- Anything new should come with a test to verify that it does what we think it
  does.
- Any bug fix should always come with a test so that we don't have to encounter
  the same bug multiple times.

### Design Cycle

The design process, and management techniques vary from team to team, however,
we strive to have continuous deployments. Releasing many small features as they
become production ready.

Security is taken into account during all phases of the software development
life-cycle:

- unit tests think about potential threats,
- linting helps with finding potential prolems in advance,
- and when testing on staging, we attempt to test potential exploits, etc.

### Changes

This is a living document and may be updated from time to time. Please refer to
the [git history](https://github.com/tunnckoCore/hela/commits/master/.github/SECURITY.md) for this document to
view the changes.

### License

This document was inspired by and got adapted from
[npm Security Policy document](https://www.npmjs.com/policies/security) and
several other security policies. It may be reused under a
[CC BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).
