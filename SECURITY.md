# Security Policy

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting:

https://github.com/ayers-software-repair/assemblejs/security/advisories/new

If you cannot use that form, email security@ayers.repair with the subject
`[AssembleJS security] <short summary>`. Include the affected package and version, a minimal
reproduction, your assessment of the impact, and a suggested fix if you have one.

## What is in scope

Any way an assembly, a page, a service, an api, or the events wiring can be made to run code,
read files, or reach data it should not; any way a remote assembly can affect the page beyond
its own markup; any weakness in the CLI's generated projects.

## What is out of scope

Vulnerabilities in a user's own assemblies or services; issues in dependencies that have no
reachable path through AssembleJS (report those upstream); denial of service through resource
exhaustion of a self-hosted server without an amplification factor.

## Response

- Acknowledgement within 3 business days.
- Triage (confirmed, needs more information, or not applicable) within 7 business days.
- A fix or a documented mitigation timeline once confirmed.

## Disclosure

Coordinated: details stay private until a fix ships and we agree on timing, normally with the
patched release's GitHub Security Advisory.

## Supported versions

| Version               | Supported                 |
| --------------------- | ------------------------- |
| latest 1.x            | yes                       |
| prereleases on `next` | until the next prerelease |
