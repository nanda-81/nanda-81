# Hybrid student GitHub profile design

## Goal

Present Nanda Kishore as an early-career student developer who builds practical full-stack and applied-AI products. The profile must be useful to recruiters and fellow developers, render reliably on GitHub, and remain simple to maintain.

## Audience and positioning

The primary audience is recruiters for student, internship, and entry-level software roles. The secondary audience is developers evaluating project quality and potential collaborators.

The hero will use the positioning: **Student full-stack developer building practical AI-powered products.** It deliberately avoids a narrow job title while retaining searchable full-stack and AI keywords.

## Content structure

1. **Hero and contact actions**: Name, positioning, short value statement, resume, LinkedIn, and email.
2. **Selected work**: Four existing repositories. Each card names the project, problem, implementation focus, and stack. Claims stay grounded in repository evidence.
3. **Technical focus**: Compact grouping of product, backend, AI/data, foundations, and delivery skills.
4. **Growth and collaboration**: A short statement about current learning, open-source contribution practice, and opportunities sought.
5. **Contact close**: A clean repeat of professional links.

## Reliability and maintenance

- Remove externally hosted statistics, streak, and contribution-snake images. They are visual dependencies outside the repository and may fail, rate-limit, or render inconsistently.
- Keep the locally hosted banner and project icons, with meaningful alternative text.
- Keep the generated profile-signal region, but make the updater deterministic when GitHub is unavailable: an offline check must not demand a refresh solely because it generated a new timestamp.
- Validate profile-data shape, required strings, link schemes, project uniqueness, exclusions, and generated-marker placement.
- The update workflow continues to use the repository-scoped GitHub token and must never place secrets in tracked files.

## Error handling and tests

The updater will treat a GitHub API failure as a non-fatal condition. It will preserve the existing generated section and report a clear warning; `--check` will therefore remain usable without network access.

Tests will cover profile-data validation, generated-region replacement, rendering, and the offline fallback behavior. The README will be checked for local asset paths and the absence of deprecated external dashboard widgets.

## Acceptance criteria

- README positions Nanda as a student, hybrid full-stack/applied-AI developer.
- README uses only local visual assets plus normal hyperlink/badge endpoints; no third-party GitHub metric cards, streak cards, or snake animation.
- `npm test` passes.
- `npm run update:check` passes without network access when the committed generated section is valid.
- The updater changes only the generated README region when a live GitHub refresh succeeds.
