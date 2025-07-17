import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('charge_id');
  const plan = url.searchParams.get('plan');
  
  return json({
    chargeId,
    plan
  });
};

export default function Welcome() {
  const { chargeId, plan } = useLoaderData();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px 40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        {/* Logo/Icon */}
        <div style={{
          fontSize: '60px',
          marginBottom: '20px'
        }}>
          🎯
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          {chargeId ? 'Plan Selected Successfully!' : 'Welcome to Zenloop Surveys'}
        </h1>

        {/* Charge ID Display */}
        {chargeId && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ color: '#0369a1', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Subscription Details
            </div>
            <div style={{ color: '#0c4a6e', fontSize: '16px' }}>
              <strong>Charge ID:</strong> {chargeId}
            </div>
            {plan && (
              <div style={{ color: '#0c4a6e', fontSize: '16px', marginTop: '4px' }}>
                <strong>Plan:</strong> {plan}
              </div>
            )}
          </div>
        )}

        {/* Subtitle */}
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px',
          lineHeight: '1.5'
        }}>
          {chargeId 
            ? 'Your subscription is now active! You can start using all the features.'
            : 'Transform customer feedback into growth with powerful post-purchase surveys and NPS tracking'
          }
        </p>

        {/* Features */}
        <div style={{
          display: 'grid',
          gap: '16px',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <span style={{ color: '#444', fontSize: '16px' }}>Post-purchase customer surveys</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <span style={{ color: '#444', fontSize: '16px' }}>Real-time NPS tracking & analytics</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ color: '#444', fontSize: '16px' }}>Seamless Shopify integration</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link 
          to="/app"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          {chargeId ? 'Continue to App →' : 'Get Started →'}
        </Link>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          color: '#888',
          fontSize: '14px'
        }}>
          Powered by <strong>Zenloop</strong> • SaaS.group zenloop GmbH
        </div>
      </div>
    </div>
  );
} 