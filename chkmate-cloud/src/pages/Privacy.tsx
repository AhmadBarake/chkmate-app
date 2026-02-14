import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const Privacy: React.FC = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300">
      <Navbar />
      <div className="pt-24 pb-16">
        <Section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-8">Privacy Policy</h1>
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-sm text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, make a purchase, or communicate with us. 
              This may include your name, email address, and payment information.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">2. Payment Processing</h2>
            <p className="mb-4">
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
              Paddle processes your payment and handles your personal data related to the transaction in accordance with the Paddle Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, 
              and unauthorized use.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">4. Data Sharing</h2>
            <p className="mb-4">
              We do not share your personal information with third parties except as described in this policy, such as with our payment processor (Paddle) or when required by law.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">5. Data Security</h2>
            <p className="mb-4">
              We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">6. Your Rights (GDPR)</h2>
            <p className="mb-4">
              If you are a resident of the European Economic Area (EEA), you have certain data protection rights, including the right to access, correct, update, or delete your personal information.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at contact@chkmate.net.
            </p>
          </div>
        </Section>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
