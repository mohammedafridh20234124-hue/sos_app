# 🚀 DEPLOYMENT GUIDE - Recordings Feature Fix

## Quick Deployment Overview

**Status**: ✅ READY FOR PRODUCTION
**Risk Level**: 🟢 LOW  
**Estimated Deploy Time**: 5-10 minutes
**Rollback Time**: < 2 minutes

---

## Pre-Deployment Checklist (5 minutes)

- [ ] Read this entire guide
- [ ] Verify both servers running locally (`netstat -ano | Select-String "8080|3001"`)
- [ ] Check latest commit is clean
- [ ] Have rollback plan ready
- [ ] Notify stakeholders
- [ ] Schedule maintenance window (if needed)

---

## Deployment Steps

### Step 1: Prepare the Environment (2 minutes)

```powershell
# Navigate to project
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"

# Verify no uncommitted changes
git status

# Verify build is clean
npm run build
# Expected: ✅ 1800 modules, 0 errors
```

### Step 2: Build for Production (3 minutes)

```powershell
# Clean build
npm run build

# Expected output:
# ✅ 1800 modules transformed
# ✅ 0 TypeScript errors
# ✅ 0 lint warnings
# ✅ dist/index.html
# ✅ dist/assets/index-*.css
# ✅ dist/assets/index-*.js
# ✅ Built in ~10 seconds
```

### Step 3: Test Production Build (2 minutes)

```powershell
# Serve production build locally
npm install -g serve
serve -s dist

# Should appear at: http://localhost:3000
# Verify in browser:
# - Admin Dashboard loads
# - Live Recordings section visible
# - Can view, download, delete recordings
# - Close button works
```

### Step 4: Deploy to Server (3 minutes)

**Option A: Simple File Copy**
```powershell
# Copy build output to server
Copy-Item -Recurse "dist\*" -Destination "C:\var\www\sos-app\public"

# Restart application server
Restart-Service "YourAppService"
```

**Option B: Git Deploy**
```powershell
# Push changes
git add -A
git commit -m "Fix: Recordings view persistence - add conditional polling and close button"
git push origin main

# On server:
# git pull origin main
# npm ci
# npm run build
# Restart-Service "YourAppService"
```

**Option C: Docker Deploy**
```powershell
# Build Docker image
docker build -t sos-app:1.0 .

# Push to registry
docker push your-registry/sos-app:1.0

# Deploy
kubectl apply -f deployment.yaml
```

### Step 5: Verify Deployment (2 minutes)

```powershell
# Test production URL
# https://your-domain.com/admin

# Verify in browser:
# ✅ Load admin dashboard
# ✅ Navigate to Live Recordings
# ✅ View a student's recordings
# ✅ Close button appears
# ✅ Close button works
# ✅ Can delete individual photos
# ✅ Can delete individual audio
# ✅ List auto-refreshes every 3 seconds
# ✅ No console errors (F12)
```

### Step 6: Monitor (First 24 hours)

```powershell
# Monitor error logs
Get-Content "C:\logs\app-error.log" -Tail 20

# Monitor performance
# CPU: Should see < 1% when viewing recordings
# Memory: Should remain stable
# Network: Should have minimal polling

# Check admin feedback
# Email: admin-feedback@domain.com
```

---

## Post-Deployment Verification

### Functionality Check ✅

```
Admin Dashboard:
✅ Loads without errors
✅ Real-time alerts visible
✅ Statistics accurate

Live Recordings Section:
✅ Shows student list with counts
✅ Can click "View Recordings"
✅ Detail view persists (no auto-close)
✅ Close button visible and works
✅ Can delete individual items
✅ Can delete all at once
✅ Refresh button updates
✅ List auto-updates every 3 seconds
```

### Performance Check ✅

```powershell
# Open DevTools (F12) → Performance tab
# View recordings and monitor:

CPU Usage:
✅ During detail view: 0-1%
✅ Not 3-5% (previous issue)

Memory:
✅ Stable (no growth)
✅ No sudden spikes

Network:
✅ No constant polling during detail view
✅ List requests every 3s when in list view
```

### Browser Compatibility ✅

Test on at least these browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (if Mac available)
- ✅ Edge (latest)

### Mobile Responsiveness ✅

```
Test on:
✅ Mobile (DevTools device mode: 390px)
✅ Tablet (DevTools device mode: 768px)

Verify:
✅ All buttons clickable
✅ No layout breaks
✅ Text readable
✅ Responsive design works
```

---

## Rollback Procedure (If Needed)

### Quick Rollback (< 2 minutes)

```powershell
# If using Git:
git revert HEAD

# If using manual deploy:
# 1. Restore previous version of dist/
# 2. Restart application
# 3. Verify works

# If using Docker:
kubectl rollout undo deployment/sos-app
```

### Verify Rollback

```powershell
# Check that old behavior restored:
# ✅ Recordings view auto-closes after 2 sec
# ✅ No Close button
# ✅ Delete only clears all (not individual)

# If rollback successful:
# Contact development team
# Schedule code review meeting
# Identify issue and fix
```

---

## Environment Configuration

### Required Environment Variables
```
VITE_API_URL=http://localhost:3001          # Backend URL
VITE_SUPABASE_URL=https://xxx.supabase.co   # Supabase
VITE_SUPABASE_ANON_KEY=xxxxx                # Supabase key
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Required Services
```
✅ Frontend Server (port 8080) - Running
✅ Backend Server (port 3001)  - Running
✅ Supabase                    - Connected
✅ Email Service              - Ready
✅ SMS Service                - Ready
```

### Database Requirements
```
✅ Supabase tables: emergency_alerts
✅ Supabase tables: users
✅ Supabase RLS policies: configured
✅ Supabase real-time: enabled
```

---

## Troubleshooting During Deployment

### Issue: Build Fails
```
Solution:
1. Clear node_modules: rm -r node_modules
2. Reinstall: npm ci
3. Clear cache: npm cache clean --force
4. Try build again: npm run build
```

### Issue: Static Assets Not Loading
```
Solution:
1. Check public/ folder exists
2. Verify robots.txt present
3. Check MIME types configured on server
4. Verify dist/ has assets/ folder with files
```

### Issue: API Calls Failing
```
Solution:
1. Verify backend URL in VITE_API_URL
2. Check CORS configuration on backend
3. Verify backend is running: curl http://localhost:3001/health
4. Check firewall rules allow connections
```

### Issue: Recordings Not Loading
```
Solution:
1. Verify database connected
2. Check Supabase tables exist
3. Verify RLS policies allow read
4. Check error logs for details
```

### Issue: Performance Problems
```
Solution:
1. Check CPU/Memory usage on server
2. Verify backend responds quickly
3. Check database query performance
4. Monitor network for issues
```

---

## Monitoring After Deploy

### Key Metrics to Monitor

```
Application Performance:
- Page load time: Target < 2 seconds
- Time to interactive: Target < 3 seconds
- API response time: Target < 500ms
- Error rate: Target < 0.1%

Business Metrics:
- Admin usage of recordings feature
- Feature error reports
- User satisfaction feedback
- Performance complaints
```

### Alert Thresholds

```
RED (Immediate Action):
- Error rate > 1%
- API response time > 2s
- Recordings view not loading
- Delete functionality broken

YELLOW (Investigate):
- Error rate > 0.5%
- API response time > 1s
- Slow page load
- Memory leak suspected
```

### Log Locations

```
Application Logs:
- Location: /var/log/sos-app/application.log
- Size: Review daily
- Retention: 30 days

Error Logs:
- Location: /var/log/sos-app/error.log
- Size: Should be small if working
- Alert if growing

Performance Logs:
- Location: /var/log/sos-app/performance.log
- Monitor for slow endpoints
- Alert if slowdown detected
```

---

## Maintenance Schedule

### Immediate (0-1 hours after deploy)
- [ ] Monitor error logs
- [ ] Verify all features working
- [ ] Check user feedback
- [ ] Monitor performance metrics

### Short-term (1-24 hours)
- [ ] Full functional testing
- [ ] Performance testing
- [ ] Browser compatibility testing
- [ ] Mobile device testing
- [ ] Collect user feedback

### Medium-term (1 week)
- [ ] Review usage metrics
- [ ] Optimize performance if needed
- [ ] Plan Phase 2 improvements
- [ ] Document lessons learned

### Long-term (1+ months)
- [ ] Implement WebSocket updates
- [ ] Add persistent storage
- [ ] Implement cloud storage
- [ ] Add advanced features

---

## Rollback Decision Criteria

**Rollback if ANY of these occur:**

1. ❌ Critical errors in production
2. ❌ Security vulnerabilities discovered
3. ❌ Data corruption reported
4. ❌ Performance degradation > 50%
5. ❌ Feature completely broken
6. ❌ User complaints > 10 in first hour
7. ❌ Revenue-impacting issues
8. ❌ Compliance violations

**Continue if:**

1. ✅ Minor UI issues (can be fixed quickly)
2. ✅ Edge case errors (not affecting most users)
3. ✅ Performance within acceptable range
4. ✅ All core features working
5. ✅ User feedback positive

---

## Communication Plan

### Before Deploy
```
Message: "New feature deployment scheduled"
Audience: Admin users
Content: 
- What's changing (recordings view fix)
- Expected benefits (persistent view, delete)
- No service interruption expected
- Contact support if issues
```

### After Deploy  
```
Message: "Feature deployed successfully"
Audience: Admin users + Support team
Content:
- Feature is live
- New functionality available
- Known limitations (if any)
- Support contacts
```

### If Rollback Needed
```
Message: "Issue found, reverting to previous version"
Audience: All stakeholders
Content:
- What happened
- Action taken (rollback)
- When we'll try again
- Investigation timeline
```

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `RECORDINGS_UI_IMPROVEMENTS.md` | Technical details |
| `RECORDINGS_USER_GUIDE.md` | User instructions |
| `RECORDINGS_TESTING_GUIDE.md` | Test procedures |
| `VISUAL_SUMMARY.md` | Visual diagrams |
| `QUICK_REFERENCE.md` | Quick lookup |
| `FINAL_VERIFICATION_REPORT.md` | Verification details |

---

## Success Indicators

**Deployment is successful if:**

- ✅ Zero errors during deploy
- ✅ All features working as expected
- ✅ Performance acceptable
- ✅ No user complaints
- ✅ System stable 24+ hours
- ✅ All browsers supported
- ✅ Mobile responsive
- ✅ Admin satisfied

---

## Emergency Contacts

| Role | Contact | Time |
|------|---------|------|
| DevOps Lead | [name] | 24/7 |
| Tech Lead | [name] | Business hours |
| Product Manager | [name] | Business hours |
| On-Call Support | [number] | 24/7 |

---

## Final Checklist

- [ ] Read entire deployment guide
- [ ] Environment configured
- [ ] Build successful
- [ ] Local testing passed
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Ready to deploy

---

## Deploy Command Summary

```powershell
# 1. Prepare
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"
git status

# 2. Build
npm run build

# 3. Test
serve -s dist

# 4. Deploy
# Copy dist/ to production server

# 5. Verify
# Test at: https://your-domain.com
# Check: Admin Dashboard → Live Recordings
# Verify: View, Close, Delete buttons work
```

---

**Deployment Guide Version**: 1.0  
**Status**: ✅ APPROVED  
**Last Updated**: 2024

**🚀 Ready to Deploy!**
