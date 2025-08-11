'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Zap, Clock, Search, Database, Gauge, Users } from 'lucide-react';

const metrics = [
  {
    icon: Zap,
    label: 'Memory Read',
    value: '45',
    unit: 'ms',
    description: 'Lightning-fast retrieval',
    percentage: 95,
    color: 'from-green-400 to-emerald-400',
  },
  {
    icon: Clock,
    label: 'Memory Write',
    value: '120',
    unit: 'ms',
    description: 'Instant persistence',
    percentage: 88,
    color: 'from-blue-400 to-cyan-400',
  },
  {
    icon: Search,
    label: 'Vector Search',
    value: '380',
    unit: 'ms',
    description: 'Semantic accuracy',
    percentage: 75,
    color: 'from-purple-400 to-pink-400',
  },
  {
    icon: Database,
    label: 'Code Sync',
    value: '8',
    unit: 's/100 files',
    description: 'Batch processing',
    percentage: 82,
    color: 'from-orange-400 to-red-400',
  },
];

const comparisons = [
  { label: 'Without Memory', value: 100, color: 'bg-gray-600' },
  { label: 'With Memory Engineering', value: 10, color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
];

export default function Performance() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="performance" className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Blazing Fast Performance
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Optimized for speed with MongoDB Atlas and intelligent caching.
            Your AI responds instantly with full context awareness.
          </p>
        </motion.div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color}`}>
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
                <Gauge className="w-5 h-5 text-gray-500" />
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-white">
                  {metric.value}
                  <span className="text-lg text-gray-400 ml-1">{metric.unit}</span>
                </div>
                <div className="text-sm text-gray-500">{metric.label}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{metric.description}</span>
                  <span className="text-gray-400">{metric.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${metric.percentage}%` } : {}}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${metric.color}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Speed Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Development Speed Comparison</h3>
          
          <div className="space-y-6">
            {comparisons.map((item, index) => (
              <div key={item.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}x time</span>
                </div>
                <div className="h-8 bg-gray-700 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${item.value}%` } : {}}
                    transition={{ duration: 1, delay: 0.8 + index * 0.2 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold">10x Faster Development</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white">150+</div>
            <div className="text-gray-400">Weekly npm downloads</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">95%</div>
            <div className="text-gray-400">Test coverage</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">7</div>
            <div className="text-gray-400">Fixed memories</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}









