# Live Recordings - UI Reference

## Layout and Components

### Main Recordings Card

```
┌─────────────────────────────────────────────────────┐
│ 📹 Live Recordings                  🔄 Refresh      │
│ Recordings organized by student      ← Back to List │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [Student Card]                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Student Name                  📸 2 photos        ││
│  │ ID: student-id-xxx           🔊 2 audio clips   ││
│  │                               [👁️ View Recordings]││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  [Student Card]                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Another Student               📸 5 photos        ││
│  │ ID: student-id-yyy           🔊 3 audio clips   ││
│  │                               [👁️ View Recordings]││
│  └──────────────────────────────────────────────────┘│
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Recording Details View

```
┌──────────────────────────────────────────────────────┐
│ Photos (2)                        [Delete All Photos] │
├──────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │            │  │            │  │            │     │
│  │  Photo 1   │  │  Photo 2   │  │  Photo 3   │     │
│  │  120KB     │  │  115KB     │  │  125KB     │     │
│  │ 10:30:45   │  │ 10:30:50   │  │ 10:31:00   │     │
│  │[Open][🗑]  │  │[Open][🗑]  │  │[Open][🗑]  │     │
│  └────────────┘  └────────────┘  └────────────┘     │
│                                                       │
├──────────────────────────────────────────────────────┤
│ Audio Clips (2)                   [Delete All Audio]  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ Audio [🎙️ Badge]              215 KB           │ │
│  │ ▶️ ━━━━━━━━━━━━━━━━━ 0:45      🔊 100% 🔊     │ │
│  │ 10:30:45                                        │ │
│  │ [Play Audio]  [🗑]                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ Audio [🎙️ Badge]              198 KB           │ │
│  │ ▶️ ━━━━━━━━━━━━━━━━━ 0:52      🔊 100% 🔊     │ │
│  │ 10:31:15                                        │ │
│  │ [Play Audio]  [🗑]                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│                      📹                              │
│                                                       │
│              No Recordings Available                 │
│                                                       │
│     Recordings will appear here once students       │
│     trigger an emergency alert and the system       │
│     starts capturing video frames and audio clips.  │
│                                                       │
│     💡 Tip: Select an active alert on the left     │
│        to view that student's live recordings      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary Button | Blue | #3B82F6 |
| Hover State | Darker Blue | #1E40AF |
| Success Text | Green | #16A34A |
| Audio Label | Green | #15803D |
| Photo Count | Blue | #2563EB |
| Destructive | Red | #DC2626 |
| Muted Background | Gray | #F3F4F6 |
| Border | Light Gray | #D1D5DB |

## Button States

### Refresh Button 🔄
- **Normal**: Gray background, light text
- **Hover**: Slightly darker, shadow appears
- **Click**: Loading spinner animation

### View Recordings Button 👁️
- **Normal**: Blue background (#3B82F6), white text
- **Hover**: Darker blue (#1E40AF), shadow appears
- **Active**: Slightly pressed appearance

### Delete Button 🗑️
- **Normal**: Red background (#DC2626), white text
- **Hover**: Darker red, larger shadow
- **Confirm Dialog**: Secondary confirmation required

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width buttons
- Stacked photo grid (2 columns)
- Simplified spacing

### Tablet (768px - 1024px)
- 2-column student list
- 2-column photo grid
- Medium spacing

### Desktop (> 1024px)
- Full responsive grid
- 4-column photo grid
- Optimized spacing and typography

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between buttons |
| Enter | Activate focused button |
| Space | Toggle expansion (if applicable) |
| Escape | Close dialogs |

## Accessibility Features

- ✅ ARIA labels on all buttons
- ✅ Semantic HTML structure
- ✅ High contrast text
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Loading states announced

## Animation Timeline

### Fade In (Recording Details)
- Duration: 300ms
- Easing: ease-out
- Effect: Smooth entrance animation

### Hover Scale
- Duration: 200ms
- Scale: 1.05x
- Effect: Subtle enlargement on hover

### Loading Spinner
- Duration: 1000ms
- Animation: Continuous rotation
- Color: Primary blue

## Data Display Format

### Timestamp Format
```
10:30:45 AM       (for UI display)
2025-12-03T10:30:45.000Z  (in JSON)
```

### File Size Format
```
120 KB            (kilobytes)
1.2 MB            (megabytes)
Calculated as: bytes / 1024
```

### Location Format
```
Latitude:  40.116420
Longitude: -88.243440
Accuracy:  10 m
```

## State Management

### Recording States
1. **Loading**: Show spinner, disable buttons
2. **Loaded**: Display records, enable actions
3. **Empty**: Show helpful message
4. **Error**: Display error with retry option
5. **Deleting**: Confirmation dialog

### Alert States
1. **Active**: Red badge, pulsing animation
2. **Resolved**: Green badge, static
3. **Cancelled**: Gray badge, static

## Performance Optimization

### Image Loading
- Lazy loading enabled
- Progressive JPEG decoding
- Error fallback placeholder
- Cache control: no-cache (fresh data)

### Audio Loading
- Preload: metadata (headers only)
- Progressive streaming enabled
- Format: WebM (compressed)

### List Rendering
- Virtual scrolling for 50+ items
- Pagination for 100+ items
- Debounced refresh (500ms)

---

**UI Version:** 1.0
**Last Updated:** December 3, 2025
**Compatible Browsers:** Chrome, Firefox, Safari, Edge (latest)
