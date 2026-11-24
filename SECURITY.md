# Security Policy

## Supported Versions

The latest commit on the default branch (`main`) is actively maintained and receives security and stability fixes.

## Architectural Safeguards

- **Server-Side Proxy Validation (`server.ts`)**:
  - `/api/sync` and `/api/action` validate target URLs with `new URL()`, enforce `https://`, block loopback/private/link-local addresses (`localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`), and restrict destinations to Google Apps Script domains (`script.google.com`, `script.googleusercontent.com`).
  - Request payloads and spreadsheet responses are type-sanitized before forwarding or rendering.
- **No Client Secrets**:
  - No private API keys or database credentials are embedded in client bundles.
- **Role-Based Kiosk Accountability**:
  - Regular members must supply a valid borrower email address on checkouts and check-ins.
  - Administrative operations (API configuration, factory data reset, PIN/email management, batch returns, and email-optional admin checkouts/check-ins) require unlocking Admin Mode.
  - Note: For club kiosk convenience, the default admin PIN/email list is configurable in Settings and stored per browser; teams deploying publicly should customize the Admin PIN and authorized email list immediately after setup.

## Reporting a Vulnerability

If you discover a security issue, please avoid posting exploit details in public issues. Report it privately to the club lead or repository maintainers with:

1. A clear description of the issue and affected endpoint or component.
2. Steps to reproduce or minimal proof-of-concept details.
3. Any suggested remediation or configuration notes.
