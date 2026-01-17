/**
 * Meta (Facebook/Instagram) API Rate Limiter
 * Handles rate limit errors and prevents API quota exhaustion
 * 
 * Meta Rate Limits:
 * - Instagram Graph API: 200 calls per hour per user
 * - Facebook Graph API: 200 calls per hour (default)
 * - Content Publishing: ~25 posts per day for new apps
 * 
 * Error Codes:
 * - 4: API Too Many Calls
 * - 17: User request limit reached
 * - 32: Page request limit reached
 * - 613: Calls to this API have exceeded the rate limit
 */

class MetaRateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.rateLimitResetTime = null;
    this.requestCount = 0;
    this.maxRequestsPerWindow = 180; // Conservative limit (Meta allows 200/hour)
    this.windowDuration = 60 * 60 * 1000; // 60 minutes
    this.windowStartTime = Date.now();
    this.retryDelays = [2000, 5000, 10000, 30000]; // Exponential backoff delays
    this.usageData = {
      callCount: 0,
      totalCpuTime: 0,
      totalTime: 0,
      estimatedTimeToRegain: null
    };
  }

  /**
   * Add request to queue
   */
  async enqueue(requestFn, priority = 0) {
    return new Promise((resolve, reject) => {
      // If we're in an active rate limit cooldown, immediately reject
      if (this.rateLimitResetTime && Date.now() < this.rateLimitResetTime) {
        const waitTime = Math.ceil((this.rateLimitResetTime - Date.now()) / 1000);
        console.log(`🚫 Immediately rejecting Meta API request - rate limit active (resets in ${waitTime}s)`);
        
        const error = new Error('Meta API rate limit exceeded');
        error.isRateLimitError = true;
        error.rateLimitInfo = {
          resetTime: new Date(this.rateLimitResetTime).toLocaleString(),
          secondsUntilReset: waitTime,
          estimatedTimeToRegain: this.usageData.estimatedTimeToRegain
        };
        reject(error);
        return;
      }

      this.queue.push({
        requestFn,
        priority,
        resolve,
        reject,
        retryCount: 0,
        addedAt: Date.now()
      });

      // Sort queue by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      // Check if we need to reset the window
      const now = Date.now();
      if (now - this.windowStartTime >= this.windowDuration) {
        this.requestCount = 0;
        this.windowStartTime = now;
      }

      // Check if we've hit our self-imposed limit
      if (this.requestCount >= this.maxRequestsPerWindow) {
        const resetIn = this.windowDuration - (now - this.windowStartTime);
        console.log(`⏳ Meta API self-imposed rate limit reached. Waiting ${Math.ceil(resetIn / 1000)}s...`);
        
        // Re-queue the request
        this.queue.unshift(item);
        this.processing = false;
        
        // Wait and retry
        setTimeout(() => this.processQueue(), resetIn);
        return;
      }

      this.requestCount++;
      const result = await item.requestFn();
      item.resolve(result);

      // Continue processing
      this.processing = false;
      this.processQueue();

    } catch (error) {
      console.error('Meta API request failed:', error.message);
      
      // Check if it's a rate limit error
      const isRateLimitError = this.isMetaRateLimitError(error);
      
      if (isRateLimitError) {
        console.log('🚨 Meta rate limit detected, setting cooldown...');
        
        // Parse rate limit info from error
        const resetTime = this.parseRateLimitResetTime(error);
        if (resetTime) {
          this.rateLimitResetTime = resetTime;
          console.log(`⏰ Rate limit will reset at: ${new Date(resetTime).toLocaleString()}`);
        } else {
          // Default to 60 minutes if no reset time available
          this.rateLimitResetTime = Date.now() + (60 * 60 * 1000);
          console.log(`⏰ Rate limit reset time unknown, defaulting to 60 minutes`);
        }
        
        // Add rate limit info to error
        error.isRateLimitError = true;
        error.rateLimitInfo = {
          resetTime: new Date(this.rateLimitResetTime).toLocaleString(),
          secondsUntilReset: Math.ceil((this.rateLimitResetTime - Date.now()) / 1000),
          usageData: this.usageData
        };
      }

      // Check if we should retry
      if (item.retryCount < this.retryDelays.length && !isRateLimitError) {
        const delay = this.retryDelays[item.retryCount];
        console.log(`🔄 Retrying Meta request in ${delay}ms (attempt ${item.retryCount + 1}/${this.retryDelays.length})...`);
        
        item.retryCount++;
        this.queue.unshift(item);
        this.processing = false;
        
        setTimeout(() => this.processQueue(), delay);
        return;
      }

      // Max retries reached or rate limit error - reject
      item.reject(error);
      this.processing = false;
      this.processQueue();
    }
  }

  /**
   * Check if error is a Meta rate limit error
   */
  isMetaRateLimitError(error) {
    // Check error message
    if (error.message && (
      error.message.includes('rate limit') ||
      error.message.includes('too many calls') ||
      error.message.includes('User request limit')
    )) {
      return true;
    }

    // Check Meta error code in response data
    if (error.data && error.data.error) {
      const errorCode = error.data.error.code;
      const errorSubcode = error.data.error.error_subcode;
      
      // Meta rate limit error codes
      return errorCode === 4 ||   // API Too Many Calls
             errorCode === 17 ||  // User request limit reached
             errorCode === 32 ||  // Page request limit reached
             errorCode === 613;   // Calls to this API have exceeded the rate limit
    }

    return false;
  }

  /**
   * Parse rate limit reset time from error
   */
  parseRateLimitResetTime(error) {
    // Check for estimated time to regain access (in minutes)
    if (error.data && error.data.error && error.data.error.error_data) {
      const estimatedTime = error.data.error.error_data.estimated_time_to_regain_access;
      if (estimatedTime) {
        this.usageData.estimatedTimeToRegain = estimatedTime;
        return Date.now() + (estimatedTime * 60 * 1000); // Convert minutes to milliseconds
      }
    }

    // Check for usage headers (if available)
    if (error.headers) {
      const appUsage = error.headers['x-app-usage'];
      const businessUsage = error.headers['x-business-use-case-usage'];
      
      if (appUsage) {
        try {
          const usage = JSON.parse(appUsage);
          this.usageData = {
            callCount: usage.call_count,
            totalCpuTime: usage.total_cputime,
            totalTime: usage.total_time
          };
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return null; // No reset time available
  }

  /**
   * Get current rate limiter status
   */
  getStatus() {
    const now = Date.now();
    const windowRemaining = this.windowDuration - (now - this.windowStartTime);
    
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      requestCount: this.requestCount,
      maxRequests: this.maxRequestsPerWindow,
      windowRemainingMs: windowRemaining,
      windowRemainingSeconds: Math.ceil(windowRemaining / 1000),
      rateLimitActive: this.rateLimitResetTime && now < this.rateLimitResetTime,
      rateLimitResetTime: this.rateLimitResetTime ? new Date(this.rateLimitResetTime).toLocaleString() : null,
      usageData: this.usageData
    };
  }

  /**
   * Clear rate limit (for testing or manual override)
   */
  clearRateLimit() {
    console.log('🔓 Clearing Meta rate limit...');
    this.rateLimitResetTime = null;
    this.requestCount = 0;
    this.windowStartTime = Date.now();
    this.usageData = {
      callCount: 0,
      totalCpuTime: 0,
      totalTime: 0,
      estimatedTimeToRegain: null
    };
    this.processQueue();
  }
}

// Export singleton instance
const metaRateLimiter = new MetaRateLimiter();
export default metaRateLimiter;
