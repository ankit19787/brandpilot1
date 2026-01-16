import React, { useState } from 'react';
import { X, Check, Zap, Crown, Building2, Sparkles, ArrowRight } from 'lucide-react';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  currentPlan?: 'free' | 'pro' | 'business' | 'enterprise';
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

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onAction, currentPlan = 'free' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business' | 'enterprise'>(currentPlan);

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
      credits: 1000,
      features: [
        '1,000 AI credits/month',
        'Up to 10 posts/month',
        '2 social platforms',
        'Basic AI content generation',
        'Manual posting only',
        '7-day analytics history',
        'Community support'
      ],
      limits: {
        posts: '10 posts/month',
        platforms: '2 platforms (Instagram, Facebook)',
        aiGeneration: '1,000 credits',
        analytics: '7-day history',
        scheduling: 'Manual posting only'
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$29' : '$24',
      priceMonthly: billingCycle === 'monthly' ? 29 : 24,
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      popular: true,
      description: 'For serious creators and influencers',
      credits: 10000,
      features: [
        '10,000 AI credits/month',
        'Unlimited posts',
        'All social platforms (5+)',
        'Advanced AI generation',
        'Auto-posting & scheduling',
        'Brand DNA analysis',
        'Content strategy planner',
        '90-day analytics',
        'Performance insights',
        'Priority support',
        'Custom image generation'
      ],
      limits: {
        posts: 'Unlimited',
        platforms: 'All platforms (Instagram, Facebook, X, LinkedIn, YouTube)',
        aiGeneration: '10,000 credits',
        analytics: '90-day history',
        scheduling: 'Auto-posting enabled'
      }
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? '$79' : '$65',
      priceMonthly: billingCycle === 'monthly' ? 79 : 65,
      icon: Crown,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      description: 'For agencies and growing teams',
      credits: 50000,
      features: [
        '50,000 AI credits/month',
        'Unlimited posts',
        'All platforms + integrations',
        'Multi-brand management',
        'Team collaboration (5 users)',
        'Advanced analytics & reporting',
        'A/B testing tools',
        'Custom workflows',
        'Monetization planner',
        'API access',
        'White-label options',
        '24/7 priority support'
      ],
      limits: {
        posts: 'Unlimited',
        platforms: 'All platforms + API integrations',
        aiGeneration: '50,000 credits',
        analytics: 'Unlimited history + exports',
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

  const handleUpgrade = (planId: string) => {
    if (planId === 'enterprise') {
      onAction('Redirecting to enterprise sales...', 'info');
      onClose();
      return;
    }
    
    if (planId === currentPlan) {
      onAction('You are already on this plan', 'info');
      return;
    }

    // Here you would integrate with Stripe, Paddle, or your payment processor
    onAction(`Upgrading to ${planId.toUpperCase()} plan...`, 'success');
    setTimeout(() => {
      onAction('Payment processing... (Demo mode)', 'info');
    }, 1000);
    onClose();
  };

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
