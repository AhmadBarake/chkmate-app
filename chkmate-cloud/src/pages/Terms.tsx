import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const Terms: React.FC = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300">
      <Navbar />
      <div className="pt-24 pb-16">
        <Section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-8">Terms and Conditions</h1>
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-sm text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to chkmate. These Terms and Conditions govern your use of our website and services. 
              By accessing or using our services, you agree to be bound by these terms.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">2. Merchant of Record</h2>
            <p className="mb-4">
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
              Paddle provides all customer service inquiries and handles returns.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">3. Use of Services</h2>
            <p className="mb-4">
              You agree to use our services only for lawful purposes and in accordance with these Terms. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">4. Intellectual Property</h2>
            <p className="mb-4">
              The content, features, and functionality of our services are owned by chkmate and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall chkmate or its suppliers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the services.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">6. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms and Conditions on this page.
            </p>

            <h2 className="text-2xl font-semibold text-slate-50 mt-8 mb-4">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at contact@chkmate.net.
            </p>
          </div>
        </Section>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
