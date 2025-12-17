# Recordings Feature - Complete Testing Guide

## System Status Check

### Prerequisites
Before testing, verify both servers are running:

```powershell
# Check frontend server (port 8080)
netstat -ano | Select-String "8080"
# Expected output: LISTENING

# Check backend server (port 3001)  
netstat -ano | Select-String "3001"
# Expected output: LISTENING
```

## Test Scenarios

### Test 1: View Recordings Without Auto-Close
**Objective**: Verify the recordings detail view persists and doesn't auto-close

**Steps**:
1. Navigate to http://localhost:8080
2. Login to the Admin Dashboard
3. Scroll to "Live Recordings" section
4. Click "View Recordings" on any student with recordings
5. **Expected**: Detail view appears with photos and audio clips
6. Wait 5 seconds
7. **Expected**: View remains open (no auto-close to list)
8. Wait another 10 seconds
9. **Expected**: View still persists

**Pass Criteria**: ✅ Detail view remains visible for 15+ seconds

---

### Test 2: Header Information Display
**Objective**: Verify the header shows correct information

**Steps**:
1. In detail view (from Test 1)
2. Check the CardDescription
3. **Expected**: Shows "Viewing X photos and Y audio clips"
4. Look at the buttons
5. **Expected**: Should see both "🔄 Refresh" and "✕ Close" buttons

**Pass Criteria**: ✅ Header info matches recording count

---

### Test 3: Close Button Functionality
**Objective**: Verify the close button returns to list view

**Steps**:
1. In detail view (from Test 1)
2. Click "✕ Close" button
3. **Expected**: Returns to list view showing all students
4. **Expected**: Detail view clears
5. Wait 3 seconds
6. **Expected**: List automatically refreshes

**Pass Criteria**: ✅ Clicking Close returns to list, polling resumes

---

### Test 4: Delete Individual Photo
**Objective**: Verify individual photo deletion works

**Steps**:
1. Go back to detail view for a student with photos
2. Find a photo in the grid
3. Click the trash icon (🗑️) on a photo
4. **Expected**: Confirmation dialog appears
5. Click "Delete" or "Confirm"
6. **Expected**: 
   - Photo immediately disappears from grid
   - Toast notification appears "File Deleted"
   - Photo count in header decreases

**Pass Criteria**: ✅ Photo removed from UI immediately, count updates

---

### Test 5: Delete Individual Audio
**Objective**: Verify individual audio clip deletion works

**Steps**:
1. In detail view with audio clips
2. Find an audio clip in the list
3. Click the trash icon (🗑️) on the audio
4. **Expected**: Confirmation dialog appears
5. Click confirm
6. **Expected**:
   - Audio clip disappears from list
   - Toast notification appears
   - Audio count in header decreases

**Pass Criteria**: ✅ Audio clip removed, count updates

---

### Test 6: Delete All Photos
**Objective**: Verify bulk photo deletion works

**Steps**:
1. In detail view with photos
2. Note the current photo count
3. Click "Delete All Photos" button
4. **Expected**: Confirmation dialog appears
5. Click confirm
6. **Expected**:
   - All photos disappear from grid
   - "Photos (0)" shows in header
   - Toast shows "X photo(s) deleted"

**Pass Criteria**: ✅ All photos removed, header updated

---

### Test 7: Delete All Audio
**Objective**: Verify bulk audio deletion works

**Steps**:
1. In detail view with audio clips
2. Note the current audio count
3. Click "Delete All Audio" button
4. **Expected**: Confirmation dialog appears
5. Click confirm
6. **Expected**:
   - All audio disappears
   - "Audio Clips (0)" shows in header
   - Toast shows "X audio file(s) deleted"

**Pass Criteria**: ✅ All audio removed, header updated

---

### Test 8: View Photo
**Objective**: Verify viewing individual photos works

**Steps**:
1. In detail view with photos
2. Click "Open Photo" button on a photo
3. **Expected**: Photo opens in new tab or downloads
4. Verify image is readable and correct

**Pass Criteria**: ✅ Photo opens/downloads successfully

---

### Test 9: Download Audio
**Objective**: Verify audio download functionality

**Steps**:
1. In detail view with audio clips
2. Use audio player to listen
3. Click "Download" button
4. **Expected**: Audio file downloads to device
5. Verify file can be played

**Pass Criteria**: ✅ Audio downloads and plays correctly

---

### Test 10: Refresh Button
**Objective**: Verify refresh updates recordings list

**Steps**:
1. In detail view
2. Click "🔄 Refresh" button
3. **Expected**: Page may briefly show loading state
4. **Expected**: Same recordings still displayed (or new ones if added)
5. Try adding a new recording from student side
6. Click refresh
7. **Expected**: New recording appears

**Pass Criteria**: ✅ Refresh updates list appropriately

---

### Test 11: Auto-Refresh in List View
**Objective**: Verify list view auto-refreshes every 3 seconds

**Steps**:
1. Return to list view (click Close)
2. Watch the student list
3. Add a new recording from student dashboard
4. **Expected**: New student appears in list within 3-6 seconds
5. Wait another 6 seconds
6. **Expected**: Recording counts update automatically

**Pass Criteria**: ✅ List refreshes automatically every 3 seconds

---

### Test 12: Responsive Design
**Objective**: Verify UI works on different screen sizes

**Steps**:
1. Press F12 to open Developer Tools
2. Click device toggle (responsive design mode)
3. Test on:
   - Mobile (iPhone 12): 390px width
   - Tablet (iPad): 768px width
   - Desktop (1920x1080): Full screen
4. For each size:
   - Navigate to recordings
   - View detail
   - Try all buttons
   - Try deletions
5. **Expected**: All elements visible and functional

**Pass Criteria**: ✅ Works on mobile, tablet, and desktop

---

### Test 13: Error Handling
**Objective**: Verify graceful error handling

**Steps**:
1. Stop the backend server (port 3001)
2. Try to refresh recordings
3. **Expected**: 
   - Error notification appears (or graceful empty state)
   - App doesn't crash
   - Can still navigate UI
4. Restart backend server
5. Click refresh
6. **Expected**: Recordings load again

**Pass Criteria**: ✅ App handles errors gracefully

---

### Test 14: Confirmation Dialogs
**Objective**: Verify deletion confirmations work properly

**Steps**:
1. Click delete on a photo
2. Confirmation dialog appears
3. Click "Cancel" or close dialog
4. **Expected**: Photo is NOT deleted
5. Try again with same photo
6. Click "Delete" button in dialog
7. **Expected**: Photo is deleted

**Pass Criteria**: ✅ Confirmations work correctly

---

### Test 15: Empty State
**Objective**: Verify empty state displays correctly

**Steps**:
1. Delete all recordings for a student
2. View their recordings
3. **Expected**: Shows "No photos yet" and "No audio clips yet"
4. Close and reopen
5. **Expected**: Empty state still shows

**Pass Criteria**: ✅ Empty state displays appropriately

---

## Performance Tests

### Performance Test 1: Load Time
**Objective**: Verify detail view loads quickly

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "View Recordings" on a student
4. Watch network requests
5. **Expected**: Page loads in < 2 seconds
6. **Expected**: All images and audio load smoothly

**Pass Criteria**: ✅ Load time < 2 seconds

---

### Performance Test 2: UI Responsiveness
**Objective**: Verify UI stays responsive during operations

**Steps**:
1. In detail view with many recordings (50+)
2. Scroll through the grid
3. Click delete
4. **Expected**: Scrolling is smooth (no lag)
5. **Expected**: Deletion is instant in UI

**Pass Criteria**: ✅ No lag or jank during operations

---

### Performance Test 3: Memory Usage
**Objective**: Verify no memory leaks

**Steps**:
1. Open DevTools → Performance tab
2. View recordings (detail view)
3. Switch to list view
4. Repeat 10 times
5. Check memory graph
6. **Expected**: Memory stays relatively stable
7. **Expected**: No continuous growth

**Pass Criteria**: ✅ Memory stable, no leaks

---

## Browser Compatibility Tests

### Test Each Browser

| Browser | Steps | Expected Result |
|---------|-------|-----------------|
| Chrome | All tests | ✅ Pass |
| Firefox | All tests | ✅ Pass |
| Safari | All tests | ✅ Pass |
| Edge | All tests | ✅ Pass |

---

## Accessibility Tests

### Test 1: Keyboard Navigation
**Objective**: Verify all functions work with keyboard

**Steps**:
1. Tab through buttons
2. **Expected**: All buttons are focusable
3. Press Enter on focused button
4. **Expected**: Button activates as normal
5. Try Escape key
6. **Expected**: Closes dialogs if open

---

### Test 2: Screen Reader
**Objective**: Verify UI is navigable with screen reader

**Steps**:
1. Enable screen reader (Windows: Narrator, Mac: VoiceOver)
2. Navigate the interface
3. **Expected**: All buttons/links are announced
4. **Expected**: Descriptions are clear and helpful

---

## Data Verification Tests

### Test 1: Data Integrity
**Objective**: Verify data isn't corrupted during operations

**Steps**:
1. Download a photo
2. Verify image displays correctly and isn't corrupted
3. Download audio
4. Verify audio plays without errors
5. Delete and refresh
6. **Expected**: Correct files shown

---

### Test 2: Concurrent Operations
**Objective**: Verify operations don't interfere with each other

**Steps**:
1. Open recordings in two browser tabs
2. Delete in tab 1
3. Switch to tab 2
4. Click refresh
5. **Expected**: Deletion is reflected in tab 2
6. Try deleting in both tabs simultaneously
7. **Expected**: No data corruption or errors

---

## Regression Tests

### Verify Previous Features Still Work

- [ ] Admin can log in successfully
- [ ] Alerts display in real-time
- [ ] Student can send emergency alert
- [ ] Student can see their own recordings
- [ ] Email notifications send correctly
- [ ] SMS notifications send correctly
- [ ] Location tracking works
- [ ] Student dashboard displays correctly

---

## Test Summary Template

```
Test Run Date: ________________
Tester Name: __________________
Browser/OS: ____________________

Test Results:
- Test 1 (View Recordings Without Auto-Close): [PASS/FAIL]
- Test 2 (Header Information Display): [PASS/FAIL]
- Test 3 (Close Button Functionality): [PASS/FAIL]
- Test 4 (Delete Individual Photo): [PASS/FAIL]
- Test 5 (Delete Individual Audio): [PASS/FAIL]
- Test 6 (Delete All Photos): [PASS/FAIL]
- Test 7 (Delete All Audio): [PASS/FAIL]
- Test 8 (View Photo): [PASS/FAIL]
- Test 9 (Download Audio): [PASS/FAIL]
- Test 10 (Refresh Button): [PASS/FAIL]
- Test 11 (Auto-Refresh in List View): [PASS/FAIL]
- Test 12 (Responsive Design): [PASS/FAIL]
- Test 13 (Error Handling): [PASS/FAIL]
- Test 14 (Confirmation Dialogs): [PASS/FAIL]
- Test 15 (Empty State): [PASS/FAIL]

Performance Tests:
- Load Time: [PASS/FAIL]
- UI Responsiveness: [PASS/FAIL]
- Memory Usage: [PASS/FAIL]

Browser Compatibility:
- Chrome: [PASS/FAIL]
- Firefox: [PASS/FAIL]
- Safari: [PASS/FAIL]
- Edge: [PASS/FAIL]

Accessibility Tests:
- Keyboard Navigation: [PASS/FAIL]
- Screen Reader: [PASS/FAIL]

Data Verification:
- Data Integrity: [PASS/FAIL]
- Concurrent Operations: [PASS/FAIL]

Regression Tests:
- Previous Features: [PASS/FAIL]

Overall Result: [PASS/FAIL]

Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Notes:
___________________________________
___________________________________
___________________________________
```

---

## Troubleshooting During Tests

### Issue: Recordings not loading
**Solution**:
1. Check browser console (F12) for errors
2. Verify backend is running: `netstat -ano | Select-String "3001"`
3. Try clicking refresh
4. Check network tab to see API responses

### Issue: Delete not working
**Solution**:
1. Check if confirmation dialog appeared
2. Look at console for error messages
3. Verify backend is running
4. Try deleting from fresh page load

### Issue: UI is laggy
**Solution**:
1. Close other browser tabs
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart the dev server
4. Check CPU usage (Ctrl+Alt+Delete)

### Issue: Detail view auto-closes
**Solution**:
This should be fixed! If it still happens:
1. Check browser console for JavaScript errors
2. Verify the AdminDashboard.tsx has the conditional polling
3. Hard refresh (Ctrl+Shift+R)
4. Restart dev server

---

## Sign-Off

- [ ] All 15 main tests passed
- [ ] Performance acceptable
- [ ] All browsers compatible
- [ ] No regression issues
- [ ] Ready for production deployment

**Approved by**: _________________ **Date**: _________
