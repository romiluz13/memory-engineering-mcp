'use client';

import Hero from '@/components/Hero';
import CodeEmbeddings from '@/components/CodeEmbeddings';
import Features from '@/components/Features';
import Performance from '@/components/Performance';
import Demo from '@/components/Demo';
import Installation from '@/components/Installation';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <CodeEmbeddings />
      <Features />
      <Performance />
      <Demo />
      <Installation />
      <Testimonials />
      <Footer />
    </main>
  );
}