'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FileText, 
  Target, 
  Activity, 
  Cpu, 
  Code2, 
  TrendingUp,
  Map
} from 'lucide-react';

const memories = [
  {
    icon: FileText,
    name: 'projectbrief',
    title: 'Project Brief',
    description: 'Foundation document that shapes all other memories. Core mission and requirements.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Target,
    name: 'productContext',
    title: 'Product Context',
    description: 'Why this exists and who needs it. Problem space and user needs.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Activity,
    name: 'activeContext',
    title: 'Active Context',
    description: 'Current work focus and learnings. Updated every 3-5 minutes.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Cpu,
    name: 'systemPatterns',
    title: 'System Patterns',
    description: 'Architecture and design patterns. Component relationships.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Code2,
    name: 'techContext',
    title: 'Tech Context',
    description: 'Technology stack and setup. Dependencies and constraints.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    name: 'progress',
    title: 'Progress',
    description: 'What works and what\'s left. Completed features and TODOs.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Map,
    name: 'codebaseMap',
    title: 'Codebase Map',
    description: 'Directory structure and code organization. Searchable embeddings.',
    color: 'from-teal-500 to-cyan-500',
  },
];

export default function Features() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Seven Core Memories
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A proven structure based on Cline's approach. Each memory serves a specific purpose,
            creating a complete knowledge system that evolves with your project.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory, index) => (
            <motion.div
              key={memory.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"
                style={{
                  background: `linear-gradient(to right, ${memory.color.split(' ')[1]}, ${memory.color.split(' ')[3]})`
                }}
              />
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${memory.color} mb-4`}>
                  <memory.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{memory.title}</h3>
                <code className="text-sm text-blue-400 font-mono">{memory.name}</code>
                <p className="text-gray-400 mt-3">{memory.description}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Auto-formatted</span>
                    <span className="text-green-400">✓ Validated</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-2xl">
            <div className="bg-gray-900 rounded-2xl px-8 py-6">
              <h3 className="text-2xl font-bold mb-3">Semantic Code Search</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Powered by Voyage AI embeddings with 1024 dimensions. Find code by meaning, 
                not just text. Supports pattern matching, implementation search, and usage discovery.
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  27 patterns
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  200-line chunks
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  95% accuracy
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}









