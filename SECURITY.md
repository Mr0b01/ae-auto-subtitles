# Security Policy

AED Subtitles runs local scripts inside Adobe After Effects and can read/write files when AE scripting access is enabled.

## Supported Versions

Security fixes target the latest published release.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | Best effort |

## Reporting A Vulnerability

Please do not publish a proof-of-concept exploit in a public issue.

Report security-sensitive problems privately to the repository owner, or open a minimal GitHub issue that says a private security report is needed without disclosing exploit details.

Useful details:

- AED Subtitles version
- macOS version
- After Effects version
- exact installer/source path used
- affected file or script
- steps to reproduce

## Scope

In scope:

- unsafe file writes
- command execution issues
- installer path problems
- unexpected network behavior
- handling of untrusted subtitle/reference text

Out of scope:

- general Whisper model quality
- normal After Effects scripting permission prompts
- bugs that require manually editing project files into an invalid state
