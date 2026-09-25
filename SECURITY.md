# Security policy

## Reporting a vulnerability

Report security issues privately through
[GitHub Security Advisories](https://github.com/pabloantonelli/hornero/security/advisories/new),
not as a public issue.

Include what the problem is, how to reproduce it, and what an attacker could do
with it. You can expect a first reply within a week.

## Scope

Hornero runs inside your Home Assistant installation and holds a WhatsApp
session, so the things worth reporting are:

- Ways to send messages from the account without the API token.
- Ways to read the session credentials stored in `/data`.
- Ways for an unauthorised sender to trigger Home Assistant automations,
  bypassing the allowlist.
- Command injection through message content, service parameters, or the panel.

Out of scope: vulnerabilities in WhatsApp itself, in Baileys (report those
[upstream](https://github.com/WhiskeySockets/Baileys)), and the inherent risk
of using an unofficial WhatsApp interface, which is documented in LEGAL.md.

## Supported versions

Only the latest release receives security fixes.
