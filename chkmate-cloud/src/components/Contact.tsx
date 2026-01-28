import React, { useState } from 'react';
import Section from './Section';
import { Mail, ArrowRight } from 'lucide-react';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, integrate with email service or backend here
    alert("Thank you for your interest. We will be in touch shortly.");
  };

  return (
    <Section id="contact" className="bg-black border-t border-gray-800">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <span className="text-red-400 font-mono text-sm uppercase tracking-wider">Start Now</span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 mt-2">
            Let's Build the <br /> Future.
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md">
            Whether you are a startup looking for an MVP or an enterprise seeking digital transformation, we are ready to partner with you.
          </p>
          
          <div className="flex items-center space-x-4 text-gray-300 mb-2">
            <Mail size={20} />
            <a href="mailto:hello@chkmate.io" className="hover:text-white transition-colors">hello@chkmate.io</a>
          </div>
          
          <div className="mt-12 p-6 border border-gray-800 bg-gray-900/50">
            <h4 className="text-white font-bold mb-2">Office Hours</h4>
            <p className="text-gray-400 text-sm">Mon - Fri: 9:00 AM - 6:00 PM (EST)</p>
          </div>
        </div>

        <div className="bg-neutral-900 p-8 md:p-10 border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-400 mb-2">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formState.company}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Project Details</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formState.message}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-4 px-8 flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors group"
            >
              <span>Send Message</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </Section>
  );
};

export default Contact;