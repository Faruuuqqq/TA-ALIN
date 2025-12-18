# CineMatch AI - Improvement Checklist

## Quick Reference: What to Improve

### 🔴 CRITICAL (Do This Week)
- [ ] **Testing** - Add 8+ unit test suites (E2E, RecommendationService, MovieService)
  - Estimate: 8-12h
  - Benefit: Catch bugs early, ensure reliability
  - Files: `*.spec.ts` throughout src/

- [ ] **Input Validation** - Add class-validator + DTOs
  - Estimate: 2-3h
  - Benefit: Security + prevent crashes
  - Files: `app.controller.ts`, new `*.dto.ts` files

- [ ] **Data Caching** - Cache genres + parsed movies
  - Estimate: 1-2h
  - Benefit: Response time 10x faster
  - Files: `movie.service.ts`, `app.module.ts`

- [ ] **Performance** - Fix O(n) search bottleneck
  - Estimate: 4-6h
  - Benefit: <100ms responses instead of 100-500ms
  - Files: `recommendation.service.ts`

---

### 🟡 IMPORTANT (Do This Month)
- [ ] **API Docs** - Add Swagger/OpenAPI
  - Estimate: 2-3h
  - Benefit: Auto-generated docs, easier debugging
  - Command: `npm install @nestjs/swagger`

- [ ] **Environment Config** - Add .env support
  - Estimate: 1-2h
  - Benefit: Works in different environments
  - Files: `.env`, `main.ts`, `App.tsx`

- [ ] **Rate Limiting** - Prevent endpoint abuse
  - Estimate: 1h
  - Benefit: Better security
  - Command: `npm install @nestjs/throttler`

- [ ] **Pagination** - Add limit/offset support
  - Estimate: 1-2h
  - Benefit: Users control result count
  - Files: `app.controller.ts`

- [ ] **Search History** - Persist searches/favorites
  - Estimate: 3-4h
  - Benefit: Better UX, user data retained
  - Files: localStorage, new backend endpoint

---

### 🟢 NICE TO HAVE (Future)
- [ ] **Taste Profile UI** - Expose existing endpoint
  - Estimate: 2-3h
  - Files: New tab in ControlsPanel

- [ ] **Error Boundary** - Catch React crashes
  - Estimate: 1-2h
  - Files: New `ErrorBoundary.tsx`

- [ ] **Keyboard Navigation** - Escape to close modal
  - Estimate: 1-2h
  - Files: `MathModal.tsx`, `ControlsPanel.tsx`

- [ ] **Security Hardening** - Restrict CORS, sanitize errors
  - Estimate: 2-3h
  - Files: `main.ts`, error handling

- [ ] **i18n Support** - Multi-language
  - Estimate: 4-6h
  - Command: `npm install @nestjs/i18n`

---

## Priority Matrix

```
HIGH IMPACT, LOW EFFORT (Do First)
1. Input Validation (2-3h) ← Start here
2. Add Caching (1-2h)
3. Fix E2E Tests (1h)
4. Basic Unit Tests (4h)

MEDIUM IMPACT, LOW EFFORT (Quick Wins)
5. Swagger Docs (2-3h)
6. Environment Config (1-2h)
7. Rate Limiting (1h)
8. Pagination (1-2h)

HIGH IMPACT, MEDIUM EFFORT (Plan Soon)
9. Full Test Coverage (4-6h)
10. Performance Optimization (4-6h)
11. Search History (3-4h)
12. Security Hardening (2-3h)

MEDIUM IMPACT, MEDIUM EFFORT (Nice to Have)
13. Taste Profile UI (2-3h)
14. Error Boundaries (1-2h)
15. Keyboard Navigation (1-2h)
```

---

## File-by-File Action Items

### Backend: src/

#### app.controller.ts
- [ ] Add @ApiOperation() decorators (Swagger)
- [ ] Add @ApiResponse() examples
- [ ] Sanitize error messages (don't expose internals)
- [ ] Add limit parameter to recommendations
- [ ] Validate ratio bounds (0-1)

#### app.module.ts
- [ ] Add ThrottlerModule (rate limiting)
- [ ] Add ConfigModule (environment)
- [ ] Add CacheModule (caching)

#### main.ts
- [ ] Load PORT from env: `process.env.PORT ?? 3000`
- [ ] Add request logging middleware
- [ ] Initialize Swagger module

#### recommendation/recommendation.service.ts
- [ ] Add @Cacheable() decorator or memory cache
- [ ] Add comprehensive logging
- [ ] Write unit tests for all 3 metrics
- [ ] Add performance metrics tracking

#### math/linear-algebra.service.ts
- [ ] Add JSDoc comments for each function
- [ ] Add unit tests for euclidean distance
- [ ] Add unit tests for manhattan distance
- [ ] Handle edge cases (zero vectors)

#### movie/movie.service.ts
- [ ] Add data validation for CSV rows
- [ ] Cache loaded movies in memory
- [ ] Add error handling for bad CSV data
- [ ] Write unit tests

---

### Frontend: src/

#### App.tsx
- [ ] Extract search logic to custom hook (useSearch)
- [ ] Add React error boundary wrapper
- [ ] Add error boundary component
- [ ] Consider React Query for data fetching

#### components/MovieCard.tsx
- [ ] Add image lazy loading (loading="lazy")
- [ ] Add skeleton loader state
- [ ] Add alt text for accessibility
- [ ] Write unit tests

#### components/ControlsPanel.tsx
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add Escape key handler
- [ ] Add "Clear All" button
- [ ] Add input validation feedback
- [ ] Write unit tests

#### components/MathModal.tsx
- [ ] Add mobile scrolling support
- [ ] Add print styles
- [ ] Fix LaTeX edge cases
- [ ] Write unit tests

#### components/ErrorNotification.tsx
- [ ] Add enter/exit animations
- [ ] Add auto-dismiss timeout
- [ ] Add close button
- [ ] Show error code

#### App.css
- [ ] Add CSS custom properties (--primary, --secondary)
- [ ] Add @media print styles
- [ ] Add WCAG AA compliant colors
- [ ] Add animations for components

---

## Dependencies to Add

### Backend
```bash
npm install --save class-validator class-transformer
npm install --save @nestjs/swagger swagger-ui-express
npm install --save @nestjs/config dotenv
npm install --save @nestjs/throttler
npm install --save-dev @types/express
```

### Frontend
```bash
npm install @tanstack/react-query
npm install framer-motion
npm install --save-dev @testing-library/react @testing-library/user-event vitest
```

---

## Testing Targets

### Backend
- [ ] LinearAlgebraService: 100% coverage
- [ ] MovieService: 80% coverage
- [ ] RecommendationService: 90% coverage
- [ ] All endpoints: E2E tests

### Frontend
- [ ] App.tsx: 80% coverage
- [ ] All components: 70% coverage
- [ ] User interactions: E2E tests

### Overall Target
- [ ] **70% code coverage minimum**
- [ ] **All critical paths tested**
- [ ] **No uncaught errors in console**

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Cold Start | 2-3s | <500ms |
| Genre Load | 100ms | <10ms |
| Search Response | 100-500ms | <100ms |
| UI Render | 50-200ms | <50ms |
| Bundle Size | ~500KB | <400KB |

---

## Security Checklist

- [ ] Validate all inputs (length, type, range)
- [ ] Restrict CORS to frontend domain only
- [ ] Sanitize error messages (no internal details)
- [ ] Add rate limiting (30 req/min)
- [ ] Use environment variables for secrets
- [ ] Add HTTPS in production (use nginx reverse proxy)
- [ ] Add request logging for audit trail

---

## Documentation Checklist

- [ ] Create API.md (Swagger spec)
- [ ] Create ARCHITECTURE.md (system design)
- [ ] Create DEPLOYMENT.md (production setup)
- [ ] Create CONFIGURATION.md (.env guide)
- [ ] Create ERROR_CODES.md (all error codes)
- [ ] Create CONTRIBUTING.md (dev guide)
- [ ] Document all math formulas with diagrams

---

## Estimated Timeline

| Phase | Duration | Items |
|-------|----------|-------|
| **Week 1** | 8-10h | Critical issues (1-4) |
| **Week 2** | 6-8h | Important features (5-8) |
| **Week 3** | 8-10h | Testing & docs (9-12) |
| **Week 4** | 6-8h | Polish & optimization (13-15) |
| **Total** | **28-36h** | 15 major improvements |

---

## Success Criteria

- [ ] Test coverage >70%
- [ ] All endpoints documented in Swagger
- [ ] Response time <100ms for warm requests
- [ ] Zero console errors on valid inputs
- [ ] All security checks passing
- [ ] Environment variables working
- [ ] Liked movies persist in localStorage
- [ ] Taste profile exposed in UI
- [ ] Error boundary catches React crashes
- [ ] Rate limiting prevents abuse

---

## How to Track Progress

1. Create GitHub issues for each item
2. Use labels: critical, important, nice-to-have
3. Create project board (Kanban)
4. Track test coverage with `npm run test:cov`
5. Monitor performance with browser DevTools
6. Use git commits for each major feature

---

## Remember

- **Type safety first** - Catch errors at compile time
- **Test critical paths** - Math algorithms, API endpoints
- **Performance matters** - Users won't wait >1s
- **Security is essential** - One vulnerability ruins trust
- **Documentation saves time** - Future you will thank current you

**Start with v
