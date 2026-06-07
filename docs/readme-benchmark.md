# README Benchmark

This document tracks the five high-star GitHub projects used as the README benchmark for AED Subtitles.

## Top 5 Examples

| Project | Stars checked | What works in their README | What was applied to AED Subtitles |
| --- | ---: | --- | --- |
| [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | 163k+ | Starts with a screenshot, then a dense feature list, then installation paths. | Replaced generated hero art with real panel screenshots, added a sharper "What You Get" feature table, and kept install/run instructions close to the top. |
| [supabase/supabase](https://github.com/supabase/supabase) | 103k+ | Explains the product in one line, then routes users to docs/support/how-it-works. | Tightened the first sentence and added top navigation links: Download, Release, Install Guide, Workflow, Troubleshooting. |
| [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | 80k+ | Centered title, badges, product screenshot, "Key Capabilities", "Quick Start", resources, support. | Reworked the top of README into a centered product page with badges, real screenshots, "Built For", "What You Get", and a direct installer link. |
| [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | 72k+ | Strong visual-first README with download links before development instructions. | Moved user installation and product value above all developer setup. Added a clearer editor-focused value proposition. |
| [desktop/desktop](https://github.com/desktop/desktop) | 21k+ | Makes installer links obvious, separates beta/past/community releases, and explains who the app is for. | Added a direct macOS installer path, latest release link, install guide link, and "Built For" section before implementation details. |

## Patterns We Copied

- **Download first**: a visitor should not need to search for the installer.
- **Visual first**: the README should show real product screenshots before explaining internals.
- **One-sentence value proposition**: the top paragraph must explain who the tool is for.
- **Capabilities before commands**: users need to know why they should install it before seeing build commands.
- **Stable vs experimental**: production-safe behavior should be separated from work-in-progress renderer paths.
- **User path before developer path**: install/run/review comes before venv/build/test instructions.

## Current AED Subtitles README Shape

1. Centered title and value proposition.
2. Direct installer, release, install guide, workflow, and troubleshooting links.
3. Badges and real screenshots.
4. Download section.
5. Built-for table.
6. Feature table.
7. 5-minute install and quick run.
8. Workflow details.
9. Defaults, models, styles, stable vs experimental.
10. Troubleshooting.
11. Developer setup, build, verification, project layout.
