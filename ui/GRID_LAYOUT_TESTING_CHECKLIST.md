# Grid Layout Testing Checklist

## Overview
This checklist covers testing for the new CSS Grid-based table layout system for 4-player and 6-player poker tables. Use this to validate Grid layout implementation before making it the default.

**Related Issue:** #1593
**Branch:** `1593-change-table-layout-logic`

---

## Pre-Testing Setup

- [ ] **Dev server running**: `cd ui && yarn dev`
- [ ] **Environment**: `VITE_NODE_ENV=development` in `.env`
- [ ] **Branch**: On `1593-change-table-layout-logic`
- [ ] **Debug panel visible**: Confirm debug panel appears in UI
- [ ] **Grid toggle visible**: Toggle button shows for 4-player and 6-player tables

---

## Phase 1: 4-Player Grid Layout Testing

### Basic Functionality
- [ ] **Grid toggle works**: Click "⬜ Grid Layout OFF" → changes to "✅ Grid Layout ON"
- [ ] **Layout switches**: Players reposition from legacy to Grid layout
- [ ] **Visual inspection**: Grid layout looks correct (cross pattern: bottom, top, left, right)
- [ ] **Toggle back**: Switch back to legacy layout works correctly

### Player Components
- [ ] **Current user (bottom)**: Displays correctly with cards, stack, badge
- [ ] **Opponents**: All 3 opponents render correctly
- [ ] **Vacant seats**: Empty seats show "JOIN" button
- [ ] **Player colors**: Color themes apply correctly to each seat
- [ ] **Stack values**: Stack amounts display accurately

### Table Rotation
- [ ] **Click opponent (top)**: Table rotates, clicked player moves to bottom
- [ ] **Click opponent (left)**: Table rotates correctly
- [ ] **Click opponent (right)**: Table rotates correctly
- [ ] **Rotation animation**: Smooth 0.6s transition
- [ ] **Multiple rotations**: Clicking different seats works consistently
- [ ] **Back to original**: Can rotate back to original position

### Animations
- [ ] **Turn indicator**: Blue pulse shows on correct player during their turn
- [ ] **Win animation**: Green ripple shows for winners at showdown
- [ ] **No animation overlap**: Turn and win animations don't conflict
- [ ] **Animation timing**: Animations trigger at correct game events

### Center Content
- [ ] **Total pot displays**: Shows correct value
- [ ] **Main pot displays**: Shows correct value
- [ ] **Community cards**: All 5 cards render correctly (flop, turn, river)
- [ ] **Card images load**: No broken image links
- [ ] **Center positioning**: Content is centered in Grid

### Dealer Button
- [ ] **Dealer at bottom**: Dealer button positioned correctly
- [ ] **Dealer at top**: Dealer button positioned correctly
- [ ] **Dealer at left**: Dealer button positioned correctly
- [ ] **Dealer at right**: Dealer button positioned correctly
- [ ] **Dealer rotation**: Button moves with table rotation

### Chip Positions
- [ ] **Chips show for bottom player**: Positioned correctly
- [ ] **Chips show for top player**: Positioned correctly
- [ ] **Chips show for left player**: Positioned correctly
- [ ] **Chips show for right player**: Positioned correctly
- [ ] **Chip values**: Amounts display correctly

---

## Phase 2: 6-Player Grid Layout Testing

### Basic Functionality
- [ ] **Join 6-player table**: Navigate to a 6-player table
- [ ] **Grid toggle shows**: Toggle button appears for 6-player tables
- [ ] **Toggle to Grid**: Switch to Grid layout works
- [ ] **Visual inspection**: Hexagonal layout looks correct
- [ ] **Six seats visible**: All 6 seat positions render

### Hexagonal Seat Layout
- [ ] **Seat 1 (bottom-left)**: Positioned correctly
- [ ] **Seat 2 (left)**: Positioned correctly
- [ ] **Seat 3 (top-left)**: Positioned correctly
- [ ] **Seat 4 (top-right)**: Positioned correctly
- [ ] **Seat 5 (right)**: Positioned correctly
- [ ] **Seat 6 (bottom-right)**: Positioned correctly

### Table Rotation (6-Player)
- [ ] **Rotate to each seat**: Click all 6 seats, verify rotation works
- [ ] **Rotation formula**: `((gridPos - startIndex + 6) % 6) + 1` works correctly
- [ ] **Smooth transitions**: No jumping or layout breaking
- [ ] **Full circle**: Rotating through all 6 seats returns to start

### Center Content (6-Player)
- [ ] **Center spans 2 columns**: Grid layout correct
- [ ] **Pot displays**: Total and main pot visible
- [ ] **Community cards**: All cards render in center
- [ ] **No overlap**: Center doesn't overlap with seats

### Animations (6-Player)
- [ ] **Turn indicators**: Work for all 6 seats
- [ ] **Win animations**: Work for all 6 seats
- [ ] **Multiple winners**: Animation works for split pots

---

## Phase 3: Viewport Responsiveness

### Mobile Portrait (≤ 414px)
- [ ] **4-player Grid**: Scales correctly on small screens
- [ ] **6-player Grid**: Scales correctly on small screens
- [ ] **Touch targets**: Buttons/seats are tappable
- [ ] **Text readable**: Font sizes appropriate
- [ ] **No overflow**: All content fits on screen
- [ ] **Cards visible**: Card images not too small

### Mobile Landscape (≤ 926px, landscape)
- [ ] **4-player Grid**: Uses compact horizontal layout
- [ ] **6-player Grid**: Uses compact horizontal layout
- [ ] **Aspect ratio**: Table fits in viewport
- [ ] **Action panel**: Bottom controls accessible

### Tablet (927px - 1024px)
- [ ] **4-player Grid**: Medium sizing looks good
- [ ] **6-player Grid**: Medium sizing looks good
- [ ] **Spacing**: Gaps between seats appropriate
- [ ] **Touch-friendly**: Controls easy to tap

### Desktop (> 1024px)
- [ ] **4-player Grid**: Full-sized layout
- [ ] **6-player Grid**: Full-sized layout
- [ ] **Max-width respected**: Table doesn't get too large
- [ ] **Click interactions**: Mouse hover/click work smoothly

---

## Phase 4: Gameplay Testing

### Hand Progression (4-Player)
- [ ] **Pre-flop**: Cards dealt, blinds posted
- [ ] **Flop**: 3 community cards appear in center
- [ ] **Turn**: 4th card appears
- [ ] **River**: 5th card appears
- [ ] **Showdown**: Winner animations trigger
- [ ] **New hand**: Table resets correctly

### Hand Progression (6-Player)
- [ ] **Full hand cycle**: Complete a full hand successfully
- [ ] **Multiple players active**: 4+ players in hand
- [ ] **Folded players**: Gray out correctly
- [ ] **All-in players**: Show "ALL IN" badge
- [ ] **Sitting out**: Shows "SITTING OUT" status

### Player Actions (Grid Layout)
- [ ] **Fold**: Action registers, player grays out
- [ ] **Check**: Turn passes to next player
- [ ] **Call**: Chips move to pot
- [ ] **Bet**: Chips move, pot updates
- [ ] **Raise**: Chips move, pot updates
- [ ] **All-in**: Shows all-in badge

### Edge Cases
- [ ] **Player joins mid-hand**: New player appears correctly
- [ ] **Player leaves**: Seat becomes vacant
- [ ] **Reconnect**: Layout stays consistent after reconnect
- [ ] **Fast actions**: Rapid betting doesn't break layout
- [ ] **Side pots**: Multiple pots display correctly

---

## Phase 5: Performance Testing

### Load Time
- [ ] **Initial render**: Grid loads quickly (< 500ms)
- [ ] **Layout switch**: Toggle between Grid/legacy is instant
- [ ] **No flashing**: Smooth transition, no FOUC (Flash of Unstyled Content)

### Runtime Performance
- [ ] **Smooth animations**: 60fps during transitions
- [ ] **No jank**: Table rotation doesn't lag
- [ ] **Memory usage**: No memory leaks over time
- [ ] **Re-renders**: Components don't re-render unnecessarily

### Browser DevTools Check
- [ ] **No console errors**: Check browser console
- [ ] **No React warnings**: Check for React warnings
- [ ] **Network requests**: No excessive API calls
- [ ] **CSS Grid support**: Works in target browsers

---

## Phase 6: Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] **4-player Grid**: Works correctly
- [ ] **6-player Grid**: Works correctly
- [ ] **All features**: Full functionality

### Firefox
- [ ] **4-player Grid**: Works correctly
- [ ] **6-player Grid**: Works correctly
- [ ] **CSS Grid quirks**: No Firefox-specific issues

### Safari (macOS/iOS)
- [ ] **4-player Grid**: Works correctly
- [ ] **6-player Grid**: Works correctly
- [ ] **iOS Safari**: Touch interactions work
- [ ] **Webkit rendering**: No visual glitches

---

## Phase 7: Comparison Testing (Grid vs Legacy)

### Side-by-Side Comparison
- [ ] **Visual parity**: Grid looks similar to legacy
- [ ] **Feature parity**: All features work in both
- [ ] **Performance**: Grid is faster or equal
- [ ] **Code complexity**: Grid is simpler to maintain

### Specific Comparisons
- [ ] **Player positioning**: Matches legacy positions
- [ ] **Chip positions**: Matches legacy positions
- [ ] **Dealer button**: Positioned similarly
- [ ] **Animations**: Look and feel similar
- [ ] **Responsive behavior**: Works across all viewports

---

## Phase 8: Accessibility Testing

### Screen Readers
- [ ] **Seat labels**: Screen reader announces seats
- [ ] **Player info**: Stack values announced
- [ ] **Buttons**: Action buttons have accessible labels
- [ ] **Turn indicator**: Turn announcement

### Keyboard Navigation
- [ ] **Tab order**: Logical tab sequence
- [ ] **Focus indicators**: Visible focus states
- [ ] **Action buttons**: Accessible via keyboard
- [ ] **Grid toggle**: Can be toggled with keyboard

### Color Contrast
- [ ] **Text readable**: Sufficient contrast ratios
- [ ] **Player colors**: Distinct and colorblind-friendly
- [ ] **Badges**: Badge text readable

---

## Phase 9: Known Issues & Edge Cases

### Document Any Issues Found
```
Issue 1:
- [ ] Description:
- [ ] Severity: (Critical/High/Medium/Low)
- [ ] Steps to reproduce:
- [ ] Expected behavior:
- [ ] Actual behavior:

Issue 2:
- [ ] Description:
- [ ] Severity:
- [ ] Steps to reproduce:
- [ ] Expected behavior:
- [ ] Actual behavior:
```

---

## Phase 10: Final Validation

### Code Quality
- [ ] **No console errors**: Clean browser console
- [ ] **No TypeScript errors**: All types correct
- [ ] **No linting errors**: ESLint passes
- [ ] **Code reviewed**: Grid components follow conventions

### Documentation
- [ ] **README updated**: Grid layout documented
- [ ] **Comments clear**: Code is well-commented
- [ ] **Props documented**: Component interfaces documented

### Deployment Readiness
- [ ] **All tests pass**: No failing tests
- [ ] **Performance acceptable**: Meets performance targets
- [ ] **UX approved**: Visual design approved
- [ ] **Stakeholder sign-off**: Ready for production

---

## Testing Summary

**Total Checkboxes:** ~150+
**Estimated Testing Time:** 2-3 hours (comprehensive)
**Quick Smoke Test:** 15-20 minutes (basic functionality only)

### Quick Smoke Test (15 min)
Priority items for fast validation:
1. Grid toggle works (4-player and 6-player)
2. Players render correctly in Grid layout
3. Table rotation works
4. Turn animations show
5. Win animations show
6. Responsive on mobile/desktop
7. No console errors

### Full Regression Test (2-3 hours)
Complete all phases for production confidence.

---

## Notes
- **Browser Support**: Chrome 57+, Firefox 52+, Safari 10.1+, Edge 16+
- **CSS Grid Coverage**: 96%+ global browser support
- **Fallback**: Legacy layout available for unsupported browsers

---

## Sign-Off

**Tester Name:** ___________________
**Date:** ___________________
**Result:** [ ] Pass  [ ] Pass with issues  [ ] Fail
**Notes:**

---

**Next Steps After Testing:**
1. Document any issues in GitHub issue #1593
2. Make Grid the default for 4-player and 6-player if all tests pass
3. Consider extending to 9-player tables
4. Deprecate legacy layout configuration
5. Remove old tableLayoutConfig.ts code
