# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub: on
[almena-network/registry](https://github.com/almena-network/registry),
open the **Security** tab and choose **Report a vulnerability**. Do not open a
public issue, pull request or discussion about it.

Include what you can of:

- the version or commit, and the browser if relevant;
- what an attacker can do, and under which configuration;
- steps or a proof of concept to reproduce it.

We aim to acknowledge a report within 3 working days and to agree on a
disclosure date with you once the issue is understood. We credit reporters in
the release notes unless you prefer otherwise.

## Supported versions

The project is before its first release: only the `main` branch receives
security fixes.

## Scope

In scope, among others:

- cross-site scripting, open redirects and other injection in the portal;
- secrets or server-only data reaching the browser bundle;
- server components, route handlers or server actions that bypass the API's
  authorization or can be abused to reach other hosts (SSRF).

Out of scope:

- the development setup (`task dev`, `.env.example`);
- issues in [api](https://github.com/almena-network/api)
  itself: report them there;
- denial of service through sheer traffic volume.
