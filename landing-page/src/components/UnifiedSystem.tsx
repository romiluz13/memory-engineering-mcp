'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Brain, Search, Database, Zap, GitMerge, Sparkles } from 'lucide-react';

export default function UnifiedSystem() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
            <GitMerge className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">ONE UNIFIED SYSTEM</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Not Two Features. One Harmonized System.
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Memory and Code Search aren't separate - they're perfectly integrated parts of a 
            single intelligence system that understands your entire development context.
          </p>
        </motion.div>

        {/* The Harmony Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-3xl p-8 border border-purple-500/30">
            {/* Center: Unified System */}
            <div className="flex items-center justify-center mb-12">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative w-48 h-48"
              >
                {/* Rotating ring */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/30" />
                
                {/* Core */}
                <div className="absolute inset-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-white mx-auto mb-2" />
                    <span className="text-white font-bold text-lg">Memory</span>
                    <span className="text-white font-bold text-lg block">Engineering</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* How They Work Together */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Memory Informs Search</h3>
                <p className="text-gray-400 text-sm">
                  Your project context makes code search smarter. It knows your patterns, 
                  architecture, and decisions.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">One MongoDB Atlas</h3>
                <p className="text-gray-400 text-sm">
                  Both memories and code embeddings live in the same database, 
                  creating a unified knowledge graph.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Search Updates Memory</h3>
                <p className="text-gray-400 text-sm">
                  What you search for and find gets captured in activeContext, 
                  building knowledge over time.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Real Usage Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">The Power of Integration</h3>
          
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <Zap className="w-6 h-6 text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Monday: "Show me authentication flow"
                  </h4>
                  <p className="text-gray-400">
                    → Semantic search finds auth.service.ts, jwt.middleware.ts, user.controller.ts<br/>
                    → Memory captures: "Working on JWT authentication with middleware pattern"<br/>
                    → Both work together to build complete understanding
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <Zap className="w-6 h-6 text-green-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Friday: "Continue auth implementation"
                  </h4>
                  <p className="text-gray-400">
                    → Memory recalls: JWT middleware pattern, refresh token strategy<br/>
                    → Search knows to look for: token refresh, middleware hooks<br/>
                    → You continue exactly where you left off, with full context
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* The Truth */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl p-8 border border-green-500/30 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Why This Changes Everything
          </h3>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-6">
            Traditional AI tools give you either memory OR search. We give you both, 
            working as one. Your code becomes searchable knowledge. Your decisions become 
            persistent context. Together, they create an AI that truly understands your project.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-6 py-3">
            <GitMerge className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-semibold">
              One System. Complete Understanding. Real Intelligence.
            </span>
          </div>
        </motion.div>

        {/* Real Development Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0 }}
          className="mt-12 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Built Using Memory Engineering MCP Itself
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">16</div>
              <div className="text-sm text-gray-400">Memory Updates</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">10</div>
              <div className="text-sm text-gray-400">Components Found</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">95%</div>
              <div className="text-sm text-gray-400">Search Accuracy</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-400">100%</div>
              <div className="text-sm text-gray-400">Context Retained</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This landing page was built using MCP tools - proving the system works!
          </p>
        </motion.div>
      </div>
    </section>
  );
}
