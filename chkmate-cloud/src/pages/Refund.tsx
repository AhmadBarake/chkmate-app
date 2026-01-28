import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const Refund: React.FC = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300">
      <Navbar />
      <div className="pt-24 pb-16">
        <Section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Refund Policy</h1>
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-sm text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Satisfaction Guarantee</h2>
            <p className="mb-4">
              We stand behind our products and services. If you are not completely satisfied with your purchase, please contact us.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Paddle.com</h2>
            <p className="mb-4">
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
              Paddle handles all customer service inquiries and returns.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Refund Eligibility</h2>
            <p className="mb-4">
              We offer a 30-day money-back guarantee on our subscriptions and services. If 30 days have gone by since your purchase, 
              we generally cannot offer you a refund or exchange, though we review requests on a case-by-case basis.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Processing Refunds</h2>
            <p className="mb-4">
              To complete your return, we require a receipt or proof of purchase. Once your return is received and inspected (if applicable), 
              we will send you an email to notify you of the approval or rejection of your refund. 
              If approved, your refund will be processed by Paddle, and a credit will automatically be applied to your credit card or original method of payment.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Contact Us</h2>
            <p className="mb-4">
              For refund requests or questions, please contact us at contact@chkmate.net or through the Paddle customer support interface.
            </p>
          </div>
        </Section>
      </div>
      <Footer />
    </div>
  );
};

export default Refund;
