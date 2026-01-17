# HyperPay Connection Troubleshooting Guide

## Error: ENOTFOUND test.oppwa.com

This error occurs when Node.js cannot resolve the DNS name `test.oppwa.com`. This is typically a temporary network issue.

### Quick Fixes

1. **Test the connection:**
   ```bash
   node scripts/testHyperPayConnection.js
   ```

2. **Flush DNS cache (Windows):**
   ```bash
   ipconfig /flushdns
   ```

3. **Check internet connection:**
   ```bash
   ping test.oppwa.com
   ```

4. **Verify HyperPay configuration:**
   ```bash
   node scripts/checkHyperPayConfig.js
   ```

### Common Causes

1. **Temporary network issues** - The most common cause. Simply retry after a few seconds.

2. **DNS server problems** - Your DNS server might be temporarily unavailable.
   - Solution: Change DNS to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)

3. **Firewall/Antivirus blocking** - Security software might block the connection.
   - Solution: Temporarily disable to test, then add exception for Node.js

4. **Proxy settings** - If you're behind a corporate proxy.
   - Solution: Configure Node.js to use proxy

5. **VPN interference** - VPN might be blocking certain connections.
   - Solution: Try disconnecting VPN temporarily

### Testing Steps

1. **Test DNS resolution:**
   ```javascript
   import dns from 'dns';
   import { promisify } from 'util';
   const lookup = promisify(dns.lookup);
   
   lookup('test.oppwa.com')
     .then(address => console.log('DNS OK:', address))
     .catch(err => console.error('DNS failed:', err));
   ```

2. **Test with curl (if available):**
   ```bash
   curl https://test.oppwa.com
   ```

3. **Test in browser:**
   Open https://test.oppwa.com in your web browser

### Advanced Solutions

#### Configure Node.js DNS

```javascript
// Add to top of server.js
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
```

#### Use IPv4 only

If IPv6 is causing issues:
```javascript
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
```

#### Configure Proxy (if needed)

```javascript
// In hyperPayService.js fetch calls, add:
const agent = new https.Agent({
  // Add proxy settings here
});

fetch(url, {
  agent,
  // ... other options
});
```

### Monitor Network Issues

The error handling has been improved to provide better error messages:

- `ENOTFOUND`: DNS resolution failed - check internet connection
- `ECONNREFUSED`: Server refused connection - try again later  
- `ETIMEDOUT`: Connection timed out - slow network or server issues

### If Problem Persists

1. Check HyperPay service status at their status page
2. Contact your network administrator if behind corporate firewall
3. Try from a different network to isolate the issue
4. Check if HyperPay has any service announcements

### Production Recommendations

1. **Implement retry logic** with exponential backoff
2. **Add request timeout** to fail fast
3. **Use health checks** to monitor HyperPay availability
4. **Cache DNS results** when possible
5. **Set up monitoring** for payment gateway availability

## Testing Your Setup

Run the comprehensive test:
```bash
node scripts/testHyperPayConnection.js
```

This will:
- ✅ Test DNS resolution
- ✅ Load HyperPay configuration
- ✅ Test API connectivity
- ✅ Create a test checkout

If all tests pass, your HyperPay integration is working correctly!
