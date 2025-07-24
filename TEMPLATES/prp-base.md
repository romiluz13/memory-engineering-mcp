# 🎯 PRP: [Feature Name]

**Generated**: [timestamp]
**Confidence**: [1-10]/10 - Implementation success probability
**Research Phase**: COMPLETE
**AI-Generated**: Yes

## Goal & Context

**WHAT**: [One-line description of exactly what this feature does]
**WHY**: [The business/user value this provides]
**WHO**: [Target users who will benefit from this feature]

## Research Findings

### Codebase Pattern Analysis
**Similar Features Found**: 
- [List existing features with similar patterns]
- Files to reference: `[path/to/file.tsx:42]`
- Conventions discovered: [naming, structure, patterns to follow]

**Test Patterns**:
- [How similar features are tested in this codebase]
- Test file patterns: `[path/to/test-file.test.ts]`
- Coverage expectations: [percentage and strategy]

### External Research
**Documentation & References**:
- [Library docs with specific URLs and sections]
- [Best practice articles with URLs]
- [Official examples with URLs]

**Common Gotchas & Pitfalls**:
- [Library-specific issues to avoid]
- [Version compatibility concerns]
- [Performance considerations]
- [Security considerations]

**Best Practices Discovered**:
- [Industry standard approaches]
- [Recommended patterns for this feature type]
- [Optimization techniques]

## Implementation Blueprint

### Prerequisites
- [ ] [Any setup requirements]
- [ ] [Dependencies to install]
- [ ] [Configuration needed]

### Phase 1: [First Major Step]
**File**: `[exact/path/to/file.tsx]`
**Pattern**: Follow [specific pattern] from `[reference/file.tsx:line]`
**Approach**: [Brief description of approach]

```typescript
// EXACT pseudocode showing the approach
// Use real patterns from codebase research
interface [InterfaceName] {
  // Properties based on research
}

export const [ComponentName] = () => {
  // Implementation following discovered patterns
  // Include error handling strategy
  // Reference integration points
};
```

**Gotchas for this phase**:
- [Specific things to watch out for]
- [Common mistakes to avoid]

### Phase 2: [Second Major Step]
[Continue with same detail level...]

### Phase 3: [Integration & Testing]
**Integration Points**:
- Connects to: `[existing/component.tsx]`
- Modifies: `[files/that/change.tsx]`
- Dependencies: [npm packages or internal modules]

**Test Implementation**:
```typescript
// Test pattern following codebase conventions
describe('[FeatureName]', () => {
  // Tests based on research findings
});
```

## Validation Gates (Must be Executable)

### Level 1: TypeScript Compilation
```bash
npm run typecheck
```
**Expected**: Zero errors, zero warnings
**If fails**: [Specific troubleshooting based on research]

### Level 2: Unit Tests
```bash
npm test -- [feature-specific-test-pattern]
```
**Expected**: 100% pass rate, >80% coverage
**If fails**: [Common test failure patterns and fixes]

### Level 3: Integration Validation
```bash
npm run test:integration
# OR custom validation commands
```
**Expected**: [Specific integration success criteria]
**If fails**: [Integration troubleshooting steps]

### Level 4: Code Quality
```bash
npm run lint
npm run format
```
**Expected**: [Style and quality standards]
**If fails**: [Common linting issues and fixes]

## Context for Implementation AI

### Critical Context to Remember
- **Patterns**: Always use [specific pattern] from `[reference/file]`
- **Style**: Follow [specific style guide aspects]
- **Error Handling**: Use [project's error handling pattern]
- **State Management**: Follow [state management approach]

### Files to Study Before Implementation
1. `[path/to/similar/feature.tsx]` - [why it's relevant]
2. `[path/to/integration/point.tsx]` - [what to learn from it]
3. `[path/to/test/example.test.ts]` - [test pattern to follow]

### External Resources for Reference
- [Documentation URL] - [specific section to reference]
- [Example implementation URL] - [what to learn from it]
- [Best practices URL] - [key principles to apply]

## Quality Checklist

### Before Starting Implementation
- [ ] All patterns from research are understood
- [ ] Integration points are clear
- [ ] Gotchas are noted and planned for
- [ ] Validation strategy is defined

### During Implementation
- [ ] Following discovered patterns exactly
- [ ] Using researched libraries correctly
- [ ] Implementing validation gates as defined
- [ ] Testing approach matches codebase conventions

### Before Marking Complete
- [ ] All validation gates pass
- [ ] Integration points work correctly
- [ ] Error handling is comprehensive
- [ ] Code follows project conventions
- [ ] Feature matches original intent

## Confidence Assessment

**Current Confidence**: [1-10]/10

**Confidence Factors**:
- Pattern clarity: [1-10] - How clear are the patterns to follow?
- Context completeness: [1-10] - Is all necessary context included?
- Validation coverage: [1-10] - Are validation gates comprehensive?
- Gotcha preparation: [1-10] - Are potential issues identified?

**Ready for Implementation**: [YES/NO]
- Minimum confidence required: 8/10
- If <8, additional research needed in: [specific areas]

## Implementation Notes

### Expected File Changes
- Create: `[list of new files]`
- Modify: `[list of files to modify]`
- Test: `[list of test files to create/modify]`

### Estimated Complexity
- **Low**: Straightforward implementation following clear patterns
- **Medium**: Some complexity in integration or business logic
- **High**: Complex feature requiring careful planning and testing

### Success Criteria
- [ ] Feature works as described in WHAT section
- [ ] All validation gates pass
- [ ] Code is production-ready
- [ ] Documentation is updated if needed
- [ ] Implementation matches user intent from original request

---

## For Implementation Phase

When this PRP is complete and confidence >= 8/10, proceed with:

```bash
memory_engineering/execute-prp --prp "[feature-name]"
```

The implementation phase will:
1. Load this complete context
2. ULTRATHINK the implementation plan
3. Execute following patterns exactly
4. Run validation loops until all gates pass
5. Ensure original intent is fulfilled