/**
 * Twitter API Rate Limiter with Queue and Exponential Backoff
 * Handles rate limit errors (429) and prevents API quota exhaustion
 */

class TwitterRateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.rateLimitResetTime = null;
    this.requestCount = 0;
    this.maxRequestsPerWindow = 50; // Conservative limit (Twitter allows ~300/15min)
    this.windowDuration = 15 * 60 * 1000; // 15 minutes
    this.windowStartTime = Date.now();
    this.retryDelays = [1000, 2000, 5000, 10000]; // Exponential backoff delays
  }

  /**
   * Add request to queue
   */
  async enqueue(requestFn, priority = 0) {
    return new Promise((resolve, reject) => {
      // If we're in an active rate limit cooldown, immediately reject
      if (this.rateLimitResetTime && Date.now() < this.rateLimitResetTime) {
        const waitTime = Math.ceil((this.rateLimitResetTime - Date.now()) / 1000);
        console.log(`🚫 Immediately rejecting request - rate limit active (resets in ${waitTime}s)`);
        
        const error = new Error('Twitter rate limit exceeded');
        error.status = 429;
        error.rateLimitInfo = {
          resetTime: new Date(this.rateLimitResetTime).toLocaleString(),
          secondsUntilReset: waitTime
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

    // Check if we're in rate limit cooldown
    if (this.rateLimitResetTime && Date.now() < this.rateLimitResetTime) {
      const waitTime = this.rateLimitResetTime - Date.now();
      console.log(`⏳ Rate limit active. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    // Reset window if needed
    if (Date.now() - this.windowStartTime >= this.windowDuration) {
      this.requestCount = 0;
      this.windowStartTime = Date.now();
      console.log('✅ Rate limit window reset');
    }

    // Check if we've hit our self-imposed limit
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.windowDuration - (Date.now() - this.windowStartTime);
      console.log(`⚠️ Self-imposed rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      console.log(`📤 Processing Twitter request (${this.requestCount + 1}/${this.maxRequestsPerWindow})`);
      
      const result = await item.requestFn();
      this.requestCount++;
      item.resolve(result);

      // Small delay between requests to avoid bursting
      setTimeout(() => {
        this.processing = false;
        this.processQueue();
      }, 100);

    } catch (error) {
      await this.handleError(error, item);
    }
  }

  /**
   * Handle errors with retry logic
   */
  async handleError(error, item) {
    const isRateLimitError = error.status === 429 || 
                            error.statusCode === 429 ||
                            (error.message && error.message.includes('rate limit'));

    if (isRateLimitError) {
      console.error('🚫 Twitter rate limit hit!');
      
      // Extract reset time from error if available
      if (error.headers && error.headers['x-rate-limit-reset']) {
        this.rateLimitResetTime = parseInt(error.headers['x-rate-limit-reset']) * 1000;
      } else {
        // Default to 15 minutes if no reset time provided
        this.rateLimitResetTime = Date.now() + (15 * 60 * 1000);
      }

      const waitTime = this.rateLimitResetTime - Date.now();
      console.log(`⏰ Rate limit resets in ${Math.ceil(waitTime / 1000)}s`);

      // DON'T re-queue the request - immediately reject with error
      // This allows the /api/publish endpoint to handle it and show friendly message
      console.log('❌ Rejecting request immediately with rate limit error');
      item.reject(error);
      this.processing = false;
      
      // Continue processing other requests (they'll also fail but get proper error messages)
      this.processQueue();
      return;
    }

    // Retry logic for other errors
    if (item.retryCount < this.retryDelays.length) {
      const delay = this.retryDelays[item.retryCount];
      console.log(`🔄 Retrying request in ${delay}ms (attempt ${item.retryCount + 1}/${this.retryDelays.length})`);
      
      item.retryCount++;
      
      setTimeout(() => {
        this.queue.unshift(item);
        this.processing = false;
        this.processQueue();
      }, delay);
    } else {
      console.error('❌ Max retries exceeded');
      item.reject(error);
      this.processing = false;
      this.processQueue();
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    const remainingRequests = this.maxRequestsPerWindow - this.requestCount;
    const windowTimeRemaining = this.windowDuration - (Date.now() - this.windowStartTime);
    
    return {
      queueLength: this.queue.length,
      requestsMade: this.requestCount,
      remainingRequests,
      windowResetsIn: Math.ceil(windowTimeRemaining / 1000),
      isRateLimited: this.rateLimitResetTime && Date.now() < this.rateLimitResetTime,
      rateLimitResetsIn: this.rateLimitResetTime 
        ? Math.ceil((this.rateLimitResetTime - Date.now()) / 1000)
        : null
    };
  }

  /**
   * Clear rate limit (for testing)
   */
  clearRateLimit() {
    this.rateLimitResetTime = null;
    this.requestCount = 0;
    this.windowStartTime = Date.now();
    console.log('✅ Rate limits cleared');
  }
}

// Singleton instance
const rateLimiter = new TwitterRateLimiter();

export default rateLimiter;
