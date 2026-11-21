# Security Policy

## Supported versions

Currently, only the latest commit on `main` is supported. Older versions are
not receive security updates.

## Reporting a vulnerability

Skeuo is an independent open-source project. If you find a security issue,
please report it privately rather than opening a public issue.

For now, the application is a frontend-only prototype, so its practical attack
surface is limited to the browser bundle and any local browser storage it uses.
Report browser-side issues (for example, stored-data handling or XSS-prone
patterns) through the project's private contact route if one exists, or open a
private security advisory on the repository if that feature is available.

Once a backend exists, reports should include:

- What you found
- The affected component or endpoint
- Steps to reproduce
- The impact you expect

Please do not reuse posted reports to attack the project, its users, or its
infrastructure.

## What we cover

The project aims to handle, at minimum:

- Input validation on both client and server once a server exists
- Authentication and session handling
- Authorization for every mutation
- Safe handling of uploaded files
- Dependency and supply-chain hygiene

## What we do not promise

This project is developed by volunteers. We cannot guarantee a fix timeline,
compensation, or a response to every report. We will do our best to triage
legitimate reports and to avoid publicly disclosing unfixed issues before a
maintenance release is ready.
