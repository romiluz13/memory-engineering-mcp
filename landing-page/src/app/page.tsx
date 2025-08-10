'use client';

import Hero from '@/components/Hero';
import MemoryPersistence from '@/components/MemoryPersistence';
import CodeEmbeddings from '@/components/CodeEmbeddings';
import UnifiedSystem from '@/components/UnifiedSystem';
import Features from '@/components/Features';
import Performance from '@/components/Performance';
import Demo from '@/components/Demo';
import Installation from '@/components/Installation';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <CodeEmbeddings />
      <MemoryPersistence />
      <UnifiedSystem />
      <Features />
      <Performance />
      <Demo />
      <Installation />
      <Footer />
    </main>
  );
}