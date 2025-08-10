'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, Database, Code } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">v13.3.2 Production Ready</span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your AI Understands Code
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            <span className="text-white font-semibold">Semantic code search</span> that finds by meaning, not text.
            Plus persistent memory across sessions.
          </p>
          <p className="text-lg text-blue-300 mb-8">
            🔥 Ask "How does auth work?" and get instant, accurate answers
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
            {[
              { icon: Code, label: 'Semantic Search', value: '95% Accuracy' },
              { icon: Brain, label: '1024 Dimensions', value: 'Voyage AI' },
              { icon: Zap, label: '27 Patterns', value: 'Auto-Detected' },
              { icon: Database, label: '7 Memories', value: 'Persistent' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
              >
                <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#installation"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all transform hover:scale-105"
            >
              Get Started
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all"
            >
              See Demo
            </a>
          </motion.div>

          {/* Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
              <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-700">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="ml-4 text-sm text-gray-400">terminal</span>
              </div>
              <div className="p-4 font-mono text-sm">
                <div className="text-green-400">$ memory-engineering search "How does authentication work?"</div>
                <div className="text-blue-400 mt-2">🔍 Searching with semantic understanding...</div>
                <div className="text-gray-400">✓ auth.service.ts (95% match)</div>
                <div className="text-gray-400">✓ jwt.middleware.ts (87% match)</div>
                <div className="text-gray-400">✓ user.controller.ts (82% match)</div>
                <div className="text-green-400 mt-4">$ memory-engineering syncCode "**/*.ts"</div>
                <div className="text-blue-400 mt-2">🧠 Creating semantic embeddings...</div>
                <div className="text-gray-400">✓ 147 files processed</div>
                <div className="text-gray-400">✓ 523 code chunks indexed</div>
                <div className="text-gray-400">✓ 27 patterns detected</div>
                <div className="text-green-400 mt-2">🚀 Your code is now searchable by meaning!</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
}
