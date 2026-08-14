# Changelog

All notable public changes to this project will be documented here.

The project follows semantic versioning where practical.

## [0.1.0] - 2026-08-14

### Added

- Initial public beta.
- Native `Ctrl/Cmd+C` workflow.
- Original LaTeX recovery from live ChatGPT/KaTeX DOM.
- `$...$` inline math output.
- `$$...$$` display math output.
- Markdown reconstruction for common response structures.
- Full code-block capture from live DOM.
- Code-block line-break preservation.
- Safe fence length selection for code containing backticks.
- Partial-formula behavior that respects the user's exact visual selection.
- Parser-failure fallback to native browser copy.
- Local-only architecture with no network requests.
- Manual regression test matrix and issue templates.

### Known limitations

- Cross-message selections are intentionally not converted.
- Partial rendered equations are not reverse-engineered into partial LaTeX.
- Safari and Firefox are not yet fully validated.
- ChatGPT DOM updates may require selector changes.
