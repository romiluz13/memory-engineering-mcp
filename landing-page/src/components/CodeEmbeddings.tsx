'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Search, Brain, Zap, Code, GitBranch, FileSearch, Sparkles, ArrowRight } from 'lucide-react';

const searchExamples = [
  {
    query: '"How does authentication work?"',
    results: [
      { file: 'auth.service.ts', match: '95%', type: 'implementation' },
      { file: 'jwt.middleware.ts', match: '87%', type: 'related' },
      { file: 'user.controller.ts', match: '82%', type: 'usage' },
    ],
  },
  {
    query: '"Find error handling patterns"',
    results: [
      { file: 'error.handler.ts', match: '93%', type: 'pattern' },
      { file: 'try-catch.utils.ts', match: '88%', type: 'utility' },
      { file: 'api.service.ts', match: '79%', type: 'example' },
    ],
  },
  {
    query: '"Where is payment processing?"',
    results: [
      { file: 'payment.service.ts', match: '96%', type: 'exact' },
      { file: 'stripe.integration.ts', match: '91%', type: 'integration' },
      { file: 'checkout.component.tsx', match: '85%', type: 'ui' },
    ],
  },
];

const features = [
  {
    icon: Brain,
    title: 'Semantic Understanding',
    description: 'Finds code by meaning, not just text matches',
  },
  {
    icon: GitBranch,
    title: '27 Pattern Detection',
    description: 'Recognizes architectural patterns automatically',
  },
  {
    icon: Zap,
    title: '1024 Dimensions',
    description: 'Voyage AI embeddings for deep understanding',
  },
  {
    icon: FileSearch,
    title: 'Smart Chunking',
    description: '200-line semantic boundaries for context',
  },
];

export default function CodeEmbeddings() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="code-search" className="py-20 px-4 bg-gradient-to-b from-black via-blue-950/10 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">GAME CHANGER FEATURE</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Semantic Code Search
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your AI understands your code deeply. Ask questions in natural language,
            get precise answers instantly. No more grep nightmares.
          </p>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Semantic Code Search in Action</span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {searchExamples.map((example, index) => (
                <motion.div
                  key={example.query}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-green-400" />
                    <span className="font-mono text-green-400">$ memory-engineering search {example.query}</span>
                  </div>
                  
                  <div className="ml-6 space-y-2">
                    {example.results.map((result, i) => (
                      <motion.div
                        key={result.file}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            result.match >= '90%' ? 'bg-green-400' : 'bg-blue-400'
                          }`} />
                          <span className="text-white">{result.file}</span>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {result.type}
                          </span>
                        </div>
                        <span className={`font-semibold ${
                          result.match >= '90%' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {result.match} match
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors"
            >
              <feature.icon className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border border-blue-500/30"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Traditional Search vs. Semantic Search</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-400">❌ Traditional (grep/regex)</h4>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-400">Exact text match only</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-400">Misses renamed variables</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-400">No context understanding</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-400">Can\'t find similar patterns</span>
                </li>
              </ul>
            </div>

            {/* Semantic */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-green-400">✅ Semantic (Voyage AI)</h4>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-white">Understands meaning & intent</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-white">Finds related concepts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-white">Context-aware results</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-white">Discovers similar patterns</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.8, type: 'spring' }}
              className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3"
            >
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold text-lg">95% Search Accuracy</span>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-300 mb-6">
            Stop searching for code. Start understanding it.
          </p>
          <a
            href="#installation"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg transition-all transform hover:scale-105"
          >
            <span className="text-lg font-medium">Get Semantic Search Now</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
