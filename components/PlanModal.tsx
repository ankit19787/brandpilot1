import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Crown, Building2, ArrowRight, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { initiatePayment, verifyPayment } from '../services/hyperPayService';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  currentPlan?: 'free' | 'pro' | 'business' | 'enterprise';
  onPlanUpgrade?: (newPlan: string, credits: number, maxCredits: number) => void;
}

interface Plan {
  id: 'free' | 'pro' | 'business' | 'enterprise';
  name: string;
  price: string;
  priceMonthly: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
  description: string;
  credits: number;
  features: string[];
  limits: {
    posts: string;
    platforms: string;
    aiGeneration: string;
    analytics: string;
    scheduling: string;
  };
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onAction, currentPlan = 'free', onPlanUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business' | 'enterprise'>(currentPlan);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentWidgetLoaded, setPaymentWidgetLoaded] = useState(false);
  const [paymentBrands, setPaymentBrands] = useState<string>('VISA MASTER MADA');
  const [scriptUrl, setScriptUrl] = useState<string>('');
  const [hasCheckedPayment, setHasCheckedPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent duplicate requests
  
  // Check for payment result on component mount (when page loads after redirect)
  useEffect(() => {
    if (hasCheckedPayment || isProcessing) return;
    
    const checkPaymentResult = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      const resourcePath = urlParams.get('resourcePath');
      
      if (id) {
        // Clean up old processed payments (older than 24 hours)
        const processedPayments = JSON.parse(localStorage.getItem('processed_payments') || '{}');
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        Object.keys(processedPayments).forEach(key => {
          if (now - processedPayments[key].timestamp > oneDayMs) {
            delete processedPayments[key];
          }
        });
        localStorage.setItem('processed_payments', JSON.stringify(processedPayments));
        
        // Check if we've already processed this payment ID
        if (processedPayments[id]) {
          console.log('Payment already processed, skipping:', id);
          // Clean up URL immediately
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        console.log('Payment callback detected:', { id, resourcePath });
        setHasCheckedPayment(true);
        setIsProcessing(true);
        
        // Mark this payment as being processed
        processedPayments[id] = { timestamp: Date.now(), processed: true };
        localStorage.setItem('processed_payments', JSON.stringify(processedPayments));
        
        try {
          onAction('Verifying payment...', 'info');
          
          // Call verify endpoint
          const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
          const verifyResponse = await fetch(`http://localhost:3001/api/payment/verify/${id}`, {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });
          
          const verifyData = await verifyResponse.json();
          console.log('Payment verification result:', verifyData);
          
          if (verifyData.success) {
            // IMMEDIATELY update parent state with new user data (before reload)
            if (onPlanUpgrade) {
              onPlanUpgrade(
                verifyData.user.plan, 
                verifyData.user.credits, 
                verifyData.user.maxCredits
              );
            }
            
            // Update local storage with all user data
            const updatedAuthData = {
              ...authData,
              plan: verifyData.user.plan,
              credits: verifyData.user.credits,
              maxCredits: verifyData.user.maxCredits,
              userId: verifyData.user.id
            };
            localStorage.setItem('brandpilot_auth', JSON.stringify(updatedAuthData));
            
            // Show success message
            onAction(verifyData.message || `Successfully upgraded to ${verifyData.user.plan.toUpperCase()} plan!`, 'success');
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Close modal immediately to show updated UI
            onClose();
            
            // Reload page after delay to ensure all components refresh
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            // Handle payment failure
            const errorMessage = verifyData.error || verifyData.message || 'Payment failed';
            
            // Only show error if it's NOT a session expired/not found error
            if (!errorMessage.includes('No payment session found') && 
                !errorMessage.includes('session expired') &&
                !errorMessage.includes('30min ago')) {
              onAction(errorMessage, 'info');
            } else {
              console.log('Skipping expired session error message');
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          
          // Don't show error for expired sessions or duplicate verification attempts
          const errorMessage = error?.message || '';
          if (!errorMessage.includes('No payment session found') && 
              !errorMessage.includes('session expired') &&
              !errorMessage.includes('30min ago')) {
            // Only log non-session-expired errors
            console.error('Unexpected payment verification error:', error);
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    checkPaymentResult();
  }, [hasCheckedPayment, isProcessing]);
  
  // Load HyperPay widget script when checkoutId is set and form is rendered
  useEffect(() => {
    if (!checkoutId || !scriptUrl) return;
    
    // Wait a bit for React to render the form
    const timer = setTimeout(() => {
      const form = document.querySelector('.paymentWidgets');
      
      if (!form) {
        console.error('Payment form not found after checkout created');
        console.log('Retrying in 500ms...');
        
        // Retry once more
        setTimeout(() => {
          const retryForm = document.querySelector('.paymentWidgets');
          if (!retryForm) {
            console.error('Payment form still not found after retry');
            onAction('Error loading payment form. Please try again.', 'info');
            return;
          }
          loadWidgetScript(retryForm);
        }, 500);
        return;
      }
      
      loadWidgetScript(form);
    }, 500);
    
    function loadWidgetScript(formElement: Element) {
      console.log('Form found, loading widget script:', scriptUrl);
      
      // Remove any existing HyperPay scripts
      const existingScripts = document.querySelectorAll('script[src*="paymentWidgets.js"]');
      existingScripts.forEach(s => s.remove());
      
      const script = document.createElement('script');
      script.src = `${scriptUrl}?checkoutId=${checkoutId}`;
      script.onload = () => {
        console.log('HyperPay widget script loaded successfully');
        
        // Add a loading class to the form
        const form = document.querySelector('.paymentWidgets') as HTMLElement;
        if (form) {
          form.classList.add('loading');
        }
        
        setTimeout(() => {
          const formContent = document.querySelector('.paymentWidgets')?.innerHTML;
          console.log('Form content after init:', formContent ? 'Widget injected!' : 'Widget NOT injected');
          
          // Remove loading class
          if (form) {
            form.classList.remove('loading');
          }
          
          setPaymentWidgetLoaded(true);
          setIsPaymentLoading(false); // Hide the loading state
          
          // Scroll to payment form
          const paymentSection = document.getElementById('hyperpay-form-container');
          paymentSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1500); // Increased timeout to allow HyperPay to fully initialize
      };
      script.onerror = () => {
        console.error('Failed to load HyperPay widget script');
        onAction('Failed to load payment form. Please try again.', 'info');
      };
      document.body.appendChild(script);
    }
    
    return () => clearTimeout(timer);
  }, [checkoutId, scriptUrl]);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      priceMonthly: 0,
      icon: Sparkles,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      description: 'Perfect for testing and personal projects',
      credits: 300,
      features: [
        '300 AI credits/month',
        'Up to 10 posts/month',
        '2 social platforms',
        'Basic AI content generation',
        'Manual posting only',
        'Community support'
      ],
      limits: {
        posts: '10 posts/month',
        platforms: '2 platforms (Instagram, Facebook)',
        aiGeneration: '300 credits',
        analytics: 'Basic analytics',
        scheduling: 'Manual posting only'
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 'SR 100' : 'SR 90',
      priceMonthly: billingCycle === 'monthly' ? 100 : 90,
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      popular: true,
      description: 'For serious creators and influencers',
      credits: 1000,
      features: [
        '1,000 AI credits/month',
        'Up to 33 posts/month',
        '5 social platforms',
        'Brand DNA analysis',
        'Content Strategist',
        'Monetization planner',
        'Advanced AI generation',
        'Auto-posting & scheduling',
        'Performance insights',
        'Priority support'
      ],
      limits: {
        posts: '~33 posts/month',
        platforms: '3 platforms (Instagram, Facebook, X)',
        aiGeneration: '1,000 credits',
        analytics: 'Advanced analytics',
        scheduling: 'Auto-posting enabled'
      }
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? 'SR 300' : 'SR 250',
      priceMonthly: billingCycle === 'monthly' ? 300 : 250,
      icon: Crown,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      description: 'For agencies and growing teams',
      credits: 10000,
      features: [
        '10,000 AI credits/month',
        'Up to 333 posts/month',
        '6 social platforms',
        'Brand DNA analysis',
        'Content Strategist',
        'Monetization planner',
        'API access',
        'Team features',
        'Multi-brand management',
        'Advanced analytics & reporting',
        'Custom workflows',
        '24/7 priority support'
      ],
      limits: {
        posts: '~333 posts/month',
        platforms: '3 platforms (Instagram, Facebook, X)',
        aiGeneration: '10,000 credits',
        analytics: 'Advanced analytics + exports',
        scheduling: 'Advanced scheduling & automation'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      priceMonthly: 0,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      description: 'For large organizations',
      credits: 999999,
      features: [
        'Unlimited AI credits',
        'Unlimited everything',
        'Dedicated account manager',
        'Custom AI model training',
        'On-premise deployment option',
        'SLA guarantees',
        'Advanced security & compliance',
        'Custom integrations',
        'Training & onboarding',
        'Multi-team management',
        'Custom analytics dashboards',
        'Priority feature requests'
      ],
      limits: {
        posts: 'Unlimited',
        platforms: 'All + Custom integrations',
        aiGeneration: 'Unlimited',
        analytics: 'Custom dashboards & BI tools',
        scheduling: 'Enterprise automation'
      }
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'enterprise') {
      onAction('Redirecting to enterprise sales...', 'info');
      onClose();
      return;
    }
    
    if (planId === currentPlan) {
      onAction('You are already on this plan', 'info');
      return;
    }
    
    if (planId === 'free') {
      onAction('Cannot downgrade to free plan. Please contact support.', 'info');
      return;
    }

    try {
      setIsPaymentLoading(true);
      
      const authData = localStorage.getItem('brandpilot_auth');
      if (!authData) {
        onAction('Please login to upgrade your plan', 'info');
        setIsPaymentLoading(false);
        return;
      }

      const { token } = JSON.parse(authData);
      
      // Get user info
      const meResponse = await fetch('http://localhost:3001/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!meResponse.ok) {
        onAction('Please login again to upgrade your plan', 'info');
        setIsPaymentLoading(false);
        return;
      }
      
      const meData = await meResponse.json();
      console.log('User data:', meData);
      
      // Initiate HyperPay payment
      onAction('Creating payment checkout...', 'info');
      
      const response = await fetch('http://localhost:3001/api/payment/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId,
          billingCycle,
          amount: plans.find(p => p.id === planId)?.priceMonthly,
          currency: 'SAR',
          userEmail: meData.username
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }
      
      console.log('Checkout created:', data);
      setCheckoutId(data.checkoutId);
      setScriptUrl(data.scriptUrl || 'https://eu-test.oppwa.com/v1/paymentWidgets.js');
      if (data.brands) {
        setPaymentBrands(data.brands.join(' '));
      }
      
      setIsPaymentLoading(false); // Allow form to render
      onAction('Loading payment form...', 'info');
      // Script will be loaded by useEffect after form renders
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      onAction('Error initiating payment. Please try again.', 'info');
      setIsPaymentLoading(false);
      setIsProcessing(false);
    }
  };
  
  // This old useEffect was checking if checkoutId matches URL param
  // But it won't work because checkoutId is lost on page redirect
  // Removed in favor of the mount-time check above

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center rounded-t-3xl z-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Choose Your Plan</h2>
            <p className="text-slate-500 mt-1">Scale your content creation with AI-powered features</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-center gap-4">
            <span className={`font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-all ${
                billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            const isSelected = plan.id === selectedPlan;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? plan.borderColor : 'border-slate-200'
                } ${plan.popular ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    CURRENT
                  </div>
                )}

                {/* Plan Header */}
                <div className={`w-12 h-12 rounded-xl ${plan.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={plan.color} size={24} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4 min-h-[40px]">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-slate-500 text-sm">/month</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed ${plan.priceMonthly * 12}/year
                    </p>
                  )}
                </div>

                {/* Credits Badge */}
                <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 font-medium">
                    {plan.credits === 999999 ? '∞ Unlimited' : `${plan.credits.toLocaleString()} credits`}/mo
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade(plan.id);
                  }}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-bold transition-all mb-6 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : plan.id === 'pro'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                  {!isCurrentPlan && <ArrowRight size={16} />}
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Widget (shown when checkout is initiated) */}
        {checkoutId && (
          <div className="px-8 py-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-t border-b border-indigo-200">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <CreditCard className="mx-auto mb-3 text-indigo-600" size={48} />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Payment</h3>
                <p className="text-slate-600">Enter your card details to activate your {selectedPlan.toUpperCase()} plan</p>
              </div>
              
              {isPaymentLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto animate-spin text-indigo-600 mb-3" size={40} />
                  <p className="text-slate-600">Loading payment form...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                  {/* HyperPay payment widget will be rendered here */}
                  {/* The script automatically looks for forms with class "paymentWidgets" */}
                  <div id="hyperpay-form-container" className="relative" style={{ minHeight: '400px' }}>
                    <form 
                      id="hyperpay-payment-form"
                      action={`${window.location.origin}${window.location.pathname}`}
                      className="paymentWidgets" 
                      data-brands={paymentBrands}
                      style={{ display: 'block', width: '100%' }}
                    >
                      {/* HyperPay will inject the payment form fields here automatically */}
                      {!paymentWidgetLoaded && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                          <Loader2 className="animate-spin mb-4" size={32} />
                          <p className="text-sm">Setting up secure payment form...</p>
                          <p className="text-xs mt-2">Powered by HyperPay</p>
                        </div>
                      )}
                    </form>
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 text-center">
                      🔒 Your payment is secured with 256-bit SSL encryption. We never store your card details.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCheckoutId(null);
                      setPaymentWidgetLoaded(false);
                      setIsPaymentLoading(false);
                      // Remove the script
                      const scripts = document.querySelectorAll('script[src*="paymentWidgets.js"]');
                      scripts.forEach(s => s.remove());
                    }}
                    className="mt-4 w-full py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel Payment
                  </button>
                </div>
              )}
              
              {!isPaymentLoading && paymentWidgetLoaded && (
                <div className="text-center py-4 px-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 If you don't see the payment form above, please check the browser console (F12) for any errors.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="px-8 pb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 text-sm font-semibold text-slate-600">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-600">Posts per month</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-900">
                      {plan.limits.posts}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-600">Platforms</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-900">
                      {plan.limits.platforms}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-600">AI Generation Credits</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-900">
                      {plan.limits.aiGeneration}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-600">Analytics History</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-900">
                      {plan.limits.analytics}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-600">Scheduling</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-900">
                      {plan.limits.scheduling}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="px-8 pb-8 bg-slate-50 rounded-b-3xl">
          <h3 className="text-xl font-bold text-slate-900 mb-4 pt-6">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-slate-900 mb-2">What are AI credits?</h4>
              <p className="text-sm text-slate-600">
                Credits are used for AI-powered features like content generation, image creation, and strategy planning. 
                Different actions consume different amounts of credits.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate your billing accordingly.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-slate-600">
                We accept all major credit cards, debit cards, and PayPal. Enterprise customers can also pay via wire transfer or invoice.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Is there a refund policy?</h4>
              <p className="text-sm text-slate-600">
                Yes! We offer a 14-day money-back guarantee on all paid plans. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;
