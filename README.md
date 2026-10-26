# Zane

A desktop surface for Pi conversations and deterministic task machines.
Threads are chats. Runs are processes.

The desktop and theme foundation is in place. Workflow orchestration and tracker
integrations are planned, not shipped capabilities.

- [Product and architecture design](docs/design.md) records agreed product
  decisions, proposed technical approaches, and open questions.
- [Design-token foundation](apps/desktop/docs/design-tokens.md) documents the
  Midnight dark and Supaterm light appearances.
- [Tech Stack & Patterns](https://github.com/JohannesKlauss/zane/issues/1) tracks
  implementation choices.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run -r test
```

- Build the monorepo:

```bash
vp run -r build
```

- Run the development server:

```bash
vp run dev
```
