# Security reports

Do not include credentials, player data or an exploitable security issue in
public GitHub Issues. Use the repository's private vulnerability reporting
feature (Security → Advisories → Report a vulnerability).

Ordinary bugs without sensitive data can be reported through GitHub Issues.
Review and redact logs before attaching them. ASTRA does not automatically
upload logs or diagnostics.

The Windows portable executable is not currently Authenticode signed.
Download it only from the official repository's Releases page and compare
its SHA-256 with the published checksum. A checksum verifies integrity; it
does not certify that software is safe.
