# Security Policy

## Supported Versions

The latest commit on the default branch (`main`) is actively maintained with security and stability updates.

## Built-In Protections

- **Server Proxy Allowlist (`server.ts`)**:
  - `/api/sync` and `/api/action` validate target URLs with `new URL()`, require `https://`, block loopback, private, and link-local addresses (`localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`), and only connect to Google Apps Script domains (`script.google.com`, `script.googleusercontent.com`).
  - Incoming payloads and spreadsheet responses are type-checked and sanitized before use.
- **No Client Secrets**:
  - No private API keys or database credentials are shipped in frontend code.
- **Role-Based Access**:
  - Regular students must enter a valid email address when checking parts out or back in.
  - Admin actions (changing Google Sheet links, resetting the parts list, editing the PIN or admin emails, batch returns, and email-optional checkouts) require signing into **Admin Mode**.
  - Clubs hosting a public instance should update the default Admin PIN and authorized email list in **Settings > Admin Security** right after setup.

## Reporting a Vulnerability

If you find a security bug, please do not post exploit details in a public issue. Share details privately with a club lead or repo maintainer, including:

1. A clear summary of the issue and affected file or route.
2. Steps to reproduce it.
3. Any suggested fix or configuration notes.
