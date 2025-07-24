# Contributing to Memory Engineering MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local` and configure
4. Run tests: `pnpm test`

## Coding Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and returns
- Use interfaces over types where possible
- Avoid `any` - use `unknown` if type is truly unknown

### Code Style
- ESLint configuration is enforced
- Format with Prettier before committing
- Maximum line length: 100 characters
- Use meaningful variable names

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserData`)
- **Types/Interfaces**: PascalCase (`UserData`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case (`memory-manager.ts`)
- **MCP Tools**: snake_case with namespace (`memory_engineering/read`)

## Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(tools): add memory_engineering/search tool for hybrid search

Implements hybrid search combining vector and text search
using MongoDB Atlas Vector Search capabilities
```

## Pull Request Process

1. **Branch Naming**: `feature/description` or `fix/description`
2. **Update Tests**: Add tests for new functionality
3. **Update Docs**: Update CLAUDE.md if adding new patterns
4. **Run Checks**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
5. **PR Description**: 
   - What changes were made
   - Why they were needed
   - How to test them

## Testing

### Unit Tests
- Test individual functions and utilities
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Tests
- Test MCP tool implementations
- Test MongoDB operations
- Test embedding generation

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:unit        # Run unit tests only
pnpm test:integration # Run integration tests
pnpm test:coverage    # Generate coverage report
```

## Adding New MCP Tools

1. Define tool in `src/tools/`
2. Add input schema validation
3. Implement tool handler
4. Add comprehensive tests
5. Update CLAUDE.md with usage examples

## MongoDB Best Practices

- Always use projectId in queries
- Create appropriate indexes
- Use transactions for multi-document updates
- Handle connection errors gracefully
- Batch operations when possible

## Review Guidelines

Code will be reviewed for:
- Functionality and correctness
- Code style and conventions
- Test coverage
- Documentation updates
- Performance implications
- Security considerations

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about contributing

Tag maintainers for urgent issues.