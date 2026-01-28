import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Sectors from '../components/Sectors';
import CaseStudies from '../components/CaseStudies';
import Process from '../components/Process';
import Partners from '../components/Partners';
import FAQ from '../components/FAQ';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Partners />
        <Services />
        <Sectors />
        <CaseStudies />
        <Process />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default Home;
