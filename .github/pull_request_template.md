## Summary

Describe the change in 2-5 concise bullet points.

- TBD
- TBD

## Why

What problem does this solve? What user, product, or engineering need does it address?

## Scope

- [ ] API
- [ ] Web
- [ ] CI/CD
- [ ] Infrastructure / deployment
- [ ] Documentation

## Validation

List the checks you ran locally or in CI.

```bash
# examples
bun run lint:api
bun run typecheck:api
bun run build:api

bun run lint:web
bun run stylelint:web
bun run typecheck:web
bun run test:web
bun run build:web
```

## Screenshots / Demo

If the change affects UI or behavior, add screenshots, recordings, or request/response examples.

## Deployment Notes

Mention anything reviewers or release owners should know:

- schema or migration changes
- new environment variables
- healthcheck or monitoring changes
- rollback image tag considerations
- rollback notes
- data backfill requirements

## Checklist

- [ ] PR title follows the repository convention
- [ ] branch name matches the expected scope
- [ ] I performed a self-review
- [ ] I updated docs if needed
- [ ] I added or updated tests where appropriate
- [ ] I called out health, logging, alerting, or Sentry implications if relevant
- [ ] I noted migration or rollout implications if relevant
