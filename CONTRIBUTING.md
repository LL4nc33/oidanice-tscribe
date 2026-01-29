# Contributing

Thanks for your interest in TScribe! Here's how to get involved.

## Getting Started

```bash
git clone https://github.com/LL4nc33/oidanice-tscribe.git
cd oidanice-tscribe
cp .env.example .env
docker compose up -d
```

See [docs/development.md](docs/development.md) for local backend/frontend setup without Docker.

## Workflow

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run tests: `cd backend && pytest`
5. Commit with a descriptive message (see below)
6. Open a Pull Request

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add language selection UI
fix: handle missing subtitles gracefully
docs: update API reference
chore: bump yt-dlp version
```

## Code Style

- **Backend**: Python 3.12, type hints, async where possible
- **Frontend**: TypeScript strict, functional React components, Tailwind CSS
- **Comments**: Use `WHY:` comments to explain non-obvious decisions

## What to Work On

- Check [ROADMAP.md](ROADMAP.md) for planned features
- Look for [open issues](https://github.com/LL4nc33/oidanice-tscribe/issues)
- Bug fixes and documentation improvements are always welcome

## Reporting Bugs

Use the [bug report template](https://github.com/LL4nc33/oidanice-tscribe/issues/new?template=bug_report.md) and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS/Docker version

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure.
