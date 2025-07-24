# Feature Request Template

Use this template to request new features using Context Engineering methodology.

## FEATURE
Brief description of what you want built.

**Example:**
"Add user authentication system with login, logout, and protected routes."

## EXAMPLES
Provide examples, mockups, or references that show what you're looking for.

**Example:**
- Login form with email/password
- Dashboard that requires authentication
- Logout button that clears session
- See similar pattern in `src/components/AdminLogin.tsx`

## DOCUMENTATION
Links to relevant documentation, libraries, or resources.

**Example:**
- NextAuth.js: https://next-auth.js.org/getting-started/introduction
- JWT best practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- Project auth patterns: see `docs/authentication.md`

## OTHER CONSIDERATIONS
Any special requirements, constraints, or considerations.

**Example:**
- Must integrate with existing user database
- Should support Google OAuth
- Need to maintain session across browser tabs
- Performance: login should complete in <500ms

---

## Instructions for AI

After creating this INITIAL.md file, run:

```bash
memory_engineering/generate-prp --request "[your feature description]"
```

This will start the Context Engineering research phase that will:
1. Search your codebase for similar patterns
2. Research external best practices
3. Generate a comprehensive PRP for implementation
4. Provide validation gates and confidence scoring

The result will be a complete implementation blueprint ready for autonomous execution.