// HyperPay Payment Service
// Documentation: https://wordpresshyperpay.docs.oppwa.com/

interface HyperPayConfig {
  entityId: string;
  accessToken: string;
  mode: 'test' | 'live';
  brands: string[];
}

interface CheckoutRequest {
  amount: string;
  currency: string;
  paymentType: string;
  entityId: string;
  merchantTransactionId?: string;
  customer?: {
    email: string;
    givenName?: string;
    surname?: string;
  };
  billing?: {
    street1: string;
    city: string;
    state?: string;
    country: string;
    postcode: string;
  };
}

interface CheckoutResponse {
  id: string;
  result: {
    code: string;
    description: string;
  };
  buildNumber?: string;
  timestamp?: string;
}

interface PaymentStatus {
  id: string;
  paymentType: string;
  amount: string;
  currency: string;
  result: {
    code: string;
    description: string;
  };
  customer?: {
    email: string;
  };
  timestamp: string;
}

class HyperPayService {
  private config: HyperPayConfig;
  private baseUrl: string;

  constructor(config: HyperPayConfig) {
    this.config = config;
    this.baseUrl = config.mode === 'live' 
      ? 'https://oppwa.com/v1'
      : 'https://test.oppwa.com/v1';
  }

  /**
   * Create a checkout session for payment
   */
  async createCheckout(
    amount: number,
    currency: string,
    userEmail: string,
    plan: string,
    userId: string
  ): Promise<CheckoutResponse> {
    try {
      const requestData: CheckoutRequest = {
        entityId: this.config.entityId,
        amount: amount.toFixed(2),
        currency: currency,
        paymentType: 'DB', // Debit transaction
        merchantTransactionId: `${userId}_${plan}_${Date.now()}`,
        customer: {
          email: userEmail
        }
      };

      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HyperPay checkout failed: ${data.result?.description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('HyperPay checkout error:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(checkoutId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/checkouts/${checkoutId}/payment?entityId=${this.config.entityId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${data.result?.description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  }

  /**
   * Check if payment was successful based on result code
   * Success codes start with 000.000, 000.100, or 000.200
   */
  isPaymentSuccessful(resultCode: string): boolean {
    const successPattern = /^(000\.000\.|000\.100\.|000\.200)/;
    return successPattern.test(resultCode);
  }

  /**
   * Generate payment widget script URL
   */
  getWidgetScriptUrl(): string {
    return this.config.mode === 'live'
      ? 'https://oppwa.com/v1/paymentWidgets.js'
      : 'https://test.oppwa.com/v1/paymentWidgets.js';
  }

  /**
   * Get supported payment brands
   */
  getSupportedBrands(): string[] {
    return this.config.brands;
  }
}

// Plan pricing configuration
export const PLAN_PRICING = {
  pro: {
    monthly: 100, // ~27 USD
    yearly: 90 * 12, // ~24 USD/month billed annually
    currency: 'SAR'
  },
  business: {
    monthly: 300, // ~80 USD
    yearly: 250 * 12, // ~67 USD/month billed annually
    currency: 'SAR'
  },
  enterprise: {
    monthly: null, // Custom pricing
    yearly: null,
    currency: 'SAR'
  }
};

/**
 * Client-side function to initiate payment
 */
export async function initiatePayment(
  plan: string,
  billingCycle: 'monthly' | 'yearly',
  userEmail: string
): Promise<{ checkoutId: string; amount: number }> {
  try {
    const pricing = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];
    if (!pricing) {
      throw new Error('Invalid plan selected');
    }

    const amount = billingCycle === 'monthly' ? pricing.monthly : pricing.yearly;
    if (!amount) {
      throw new Error('Custom pricing required for this plan');
    }

    // Call backend to create checkout
    const response = await fetch('http://localhost:3001/api/payment/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        billingCycle,
        amount,
        currency: pricing.currency,
        userEmail
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout');
    }

    return {
      checkoutId: data.checkoutId,
      amount: data.amount
    };
  } catch (error) {
    console.error('Initiate payment error:', error);
    throw error;
  }
}

/**
 * Client-side function to verify payment
 */
export async function verifyPayment(checkoutId: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3001/api/payment/verify/${checkoutId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return data.success;
  } catch (error) {
    console.error('Verify payment error:', error);
    throw error;
  }
}

export default HyperPayService;
