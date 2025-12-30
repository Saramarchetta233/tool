# Vercel CRON Debugging Guide

## Quick Testing Endpoints

### 1. Comprehensive CRON Test
```bash
# Test with full diagnostics
GET /api/cron/test?secret=YOUR_CRON_SECRET

# Manual test via POST
POST /api/cron/test
{
  "secret": "YOUR_CRON_SECRET"
}
```

### 2. Manual CRON Execution Test
```bash
# Test CRON functionality manually
GET /api/cron/manual-test?secret=YOUR_CRON_SECRET

# Or via POST
POST /api/cron/manual-test
{
  "secret": "YOUR_CRON_SECRET"
}
```

### 3. CRON Status Check
```bash
# Check overall CRON configuration
GET /api/cron/status
```

## Common Issues & Solutions

### Issue 1: CRON_SECRET Not Working

**Symptoms:**
- Getting 401 Unauthorized errors
- CRONs not triggering

**Check:**
```bash
curl "https://your-domain.com/api/cron/test?secret=your-secret"
```

**Solutions:**
1. **Verify CRON_SECRET in Vercel Dashboard**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Ensure CRON_SECRET is set for Production environment
   - Value should be at least 32 characters long

2. **Redeploy after setting environment variables**
   ```bash
   vercel --prod
   ```

3. **Test secret manually**
   ```bash
   curl -X POST https://your-domain.com/api/cron/manual-test \
     -H "Content-Type: application/json" \
     -d '{"secret":"YOUR_CRON_SECRET"}'
   ```

### Issue 2: Timezone Confusion

**Problem:** Your CRON is scheduled for 00:01 but you're in Italy (UTC+1/+2)

**Understanding:**
- Vercel CRONs run in **UTC timezone**
- Italy is UTC+1 (winter) or UTC+2 (summer/DST)
- Your 00:01 UTC CRON runs at:
  - 01:01 Italy time (winter)
  - 02:01 Italy time (summer)

**Current Schedule Analysis:**
```
"schedule": "1 0 * * *"  → 00:01 UTC daily
```

**To run at midnight Italy time, change to:**
```json
{
  "path": "/api/cron/sync-week?secret=${CRON_SECRET}",
  "schedule": "0 23 * * *"  // 23:00 UTC = 00:00/01:00 Italy
}
```

### Issue 3: CRONs Only Work in Production

**Symptoms:**
- CRONs work locally but not on Vercel
- No CRON execution logs in Vercel

**Solutions:**
1. **Ensure you're testing production deployment**
   - CRONs don't work on preview deployments
   - Must be deployed to production domain

2. **Check deployment status**
   ```bash
   vercel ls
   vercel logs YOUR_DEPLOYMENT_URL
   ```

3. **Force production deployment**
   ```bash
   vercel --prod
   ```

### Issue 4: No CRON Execution Logs

**Debugging Steps:**

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard > Functions
   - Look for your CRON endpoints
   - Check execution logs and errors

2. **Use the test endpoint to verify setup**
   ```bash
   # This will show comprehensive diagnostics
   curl "https://your-domain.com/api/cron/test?secret=YOUR_CRON_SECRET"
   ```

3. **Check if CRONs are being triggered**
   - Look for log entries with "🕐 CRON sync-week called"
   - Check timestamps in Italy timezone
   - Verify request context shows Vercel CRON headers

## Manual Testing Commands

### Test Current CRON Configuration
```bash
# Get status and configuration
curl "https://your-domain.com/api/cron/status"

# Test CRON authentication
curl "https://your-domain.com/api/cron/test?secret=YOUR_CRON_SECRET"

# Test specific CRON endpoint manually
curl "https://your-domain.com/api/cron/sync-week?secret=YOUR_CRON_SECRET"
```

### Test with Different Methods
```bash
# GET request
curl "https://your-domain.com/api/cron/manual-test?secret=YOUR_CRON_SECRET"

# POST request
curl -X POST "https://your-domain.com/api/cron/manual-test" \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_CRON_SECRET"}'
```

## Enhanced Logging

The CRON endpoints now include enhanced logging that shows:

1. **Timezone Information**
   - UTC time and Italy time
   - Current hour/minute for schedule verification
   - Expected schedule times

2. **Request Context**
   - User-Agent (should show "vercel" for real CRONs)
   - Vercel-specific headers
   - Deployment environment

3. **Execution Timing**
   - Start and end timestamps
   - Total execution time
   - Performance metrics

4. **Secret Validation**
   - Secret presence and length
   - Match status with environment variable
   - Security preview (first/last 4 characters)

## Checking Vercel Logs

1. **Via Vercel CLI**
   ```bash
   vercel logs --follow
   vercel logs YOUR_FUNCTION_NAME
   ```

2. **Via Vercel Dashboard**
   - Go to Project > Functions
   - Click on your CRON function
   - View execution logs and errors

3. **Log Search Patterns**
   Look for these log entries:
   ```
   🕐 CRON sync-week called
   ⏰ Execution timing:
   📡 Request context:
   🔐 CRON Secret validation:
   ✅ WEEKLY sync completed
   ```

## Expected CRON Schedule (UTC)

Your current CRONs run at these UTC times:

| CRON | UTC Time | Italy Time (Winter) | Italy Time (Summer) |
|------|----------|---------------------|---------------------|
| sync-week | 00:01 | 01:01 | 02:01 |
| complete-sync | 14:00 | 15:00 | 16:00 |
| complete-analysis | 06:30 | 07:30 | 08:30 |
| complete-analysis | 14:30 | 15:30 | 16:30 |
| generate-tips-v2 | 23:00 | 00:00 | 01:00 |
| generate-tips-v2 | 11:00 | 12:00 | 13:00 |

## Next Steps for Debugging

1. **Test the endpoints immediately**
   ```bash
   curl "https://your-domain.com/api/cron/test?secret=YOUR_CRON_SECRET"
   ```

2. **Check Vercel Dashboard**
   - Verify CRON_SECRET is set
   - Check function logs for any errors
   - Confirm production deployment

3. **Wait for next scheduled execution**
   - The 00:01 UTC CRON should run tonight
   - Check logs tomorrow morning for execution traces

4. **If still not working**
   - Try manually triggering: `curl "https://your-domain.com/api/cron/sync-week?secret=YOUR_CRON_SECRET"`
   - Check Vercel status page for any platform issues
   - Contact Vercel support with the diagnostic information

## Troubleshooting Checklist

- [ ] CRON_SECRET is set in Vercel environment variables
- [ ] CRON_SECRET is at least 32 characters long
- [ ] Application is deployed to production (not preview)
- [ ] Manual test endpoint works with your secret
- [ ] Function logs show no deployment errors
- [ ] You're checking logs at the correct time (UTC vs Italy time)
- [ ] vercel.json file contains the CRON configuration
- [ ] Latest deployment includes the CRON endpoints

Use the test endpoints to verify each step of this checklist!