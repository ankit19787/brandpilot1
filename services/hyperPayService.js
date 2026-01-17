// HyperPay Payment Service
// Documentation: https://wordpresshyperpay.docs.oppwa.com/

class HyperPayService {
  constructor(config) {
    this.config = config;
    // Support different server regions
    if (config.mode === 'live') {
      this.baseUrl = 'https://oppwa.com/v1';
    } else if (config.mode === 'eu-test') {
      this.baseUrl = 'https://eu-test.oppwa.com/v1';
    } else {
      this.baseUrl = 'https://test.oppwa.com/v1';
    }
  }

  /**
   * Helper method to retry fetch requests on network errors
   */
  async fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        const isLastRetry = i === retries - 1;
        const isNetworkError = error.cause?.code === 'ENOTFOUND' || 
                               error.cause?.code === 'ECONNREFUSED' ||
                               error.cause?.code === 'ETIMEDOUT';
        
        if (isLastRetry || !isNetworkError) {
          throw error;
        }
        
        console.log(`Network error, retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
      }
    }
  }

  /**
   * Create a checkout session for payment
   */
  async createCheckout(amount, currency, userEmail, plan, userId) {
    try {
      const requestData = {
        entityId: this.config.entityId,
        amount: amount.toFixed(2),
        currency: currency,
        paymentType: 'DB', // Debit transaction
        merchantTransactionId: `${userId}_${plan}_${Date.now()}`,
        'customer.email': userEmail
      };
      
      // Add testMode for test environment
      if (this.config.mode === 'test') {
        requestData.testMode = 'EXTERNAL';
      }
      
      console.log('Creating checkout with params:', requestData);

      const response = await this.fetchWithRetry(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData).toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HyperPay checkout failed: ${data.result?.description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('HyperPay checkout error:', error);
      
      // Provide more helpful error messages for common network issues
      if (error.cause?.code === 'ENOTFOUND') {
        throw new Error('Network error: Unable to connect to HyperPay server. Please check your internet connection and try again.');
      } else if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error('Connection refused: HyperPay server is not responding. Please try again later.');
      } else if (error.cause?.code === 'ETIMEDOUT') {
        throw new Error('Connection timeout: HyperPay server took too long to respond. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(checkoutId) {
    try {
      console.log('Fetching payment status for checkout:', checkoutId);
      console.log('Using entity ID:', this.config.entityId);
      
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/checkouts/${checkoutId}/payment?entityId=${this.config.entityId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      const data = await response.json();
      
      console.log('Payment status response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${data.result?.description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Get payment status error:', error);
      
      // Provide more helpful error messages for common network issues
      if (error.cause?.code === 'ENOTFOUND') {
        throw new Error('Network error: Unable to connect to HyperPay server. Please check your internet connection and try again.');
      } else if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error('Connection refused: HyperPay server is not responding. Please try again later.');
      } else if (error.cause?.code === 'ETIMEDOUT') {
        throw new Error('Connection timeout: HyperPay server took too long to respond. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Check if payment was successful based on result code
   * Success codes start with 000.000, 000.100, or 000.200
   */
  isPaymentSuccessful(resultCode) {
    const successPattern = /^(000\.000\.|000\.100\.|000\.200)/;
    return successPattern.test(resultCode);
  }

  /**
   * Generate payment widget script URL
   */
  getWidgetScriptUrl() {
    if (this.config.mode === 'live') {
      return 'https://oppwa.com/v1/paymentWidgets.js';
    } else if (this.config.mode === 'eu-test') {
      return 'https://eu-test.oppwa.com/v1/paymentWidgets.js';
    } else {
      return 'https://test.oppwa.com/v1/paymentWidgets.js';
    }
  }

  /**
   * Get supported payment brands
   */
  getSupportedBrands() {
    return this.config.brands;
  }
}

export default HyperPayService;
