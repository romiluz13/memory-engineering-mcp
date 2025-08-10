'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Brain, Clock, RefreshCw, Save, Database, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const memoryFlow = [
  {
    time: '9:00 AM Monday',
    memory: 'activeContext',
    content: 'Starting authentication system with JWT',
    icon: Brain,
    status: 'created',
  },
  {
    time: '9:05 AM Monday',
    memory: 'systemPatterns',
    content: 'Decided on middleware pattern for auth',
    icon: Save,
    status: 'updated',
  },
  {
    time: '11:30 AM Monday',
    memory: 'progress',
    content: 'Auth system 80% complete, tests passing',
    icon: TrendingUp,
    status: 'updated',
  },
  {
    time: '9:00 AM Tuesday',
    memory: 'AI Remembers!',
    content: 'Picks up EXACTLY where you left off',
    icon: RefreshCw,
    status: 'success',
  },
];

const comparisonData = [
  {
    scenario: 'Without Memory',
    monday: 'Explain project structure',
    tuesday: 'Explain it again...',
    wednesday: 'And again...',
    thursday: 'Still explaining...',
    friday: 'Gave up, doing it manually',
    icon: AlertCircle,
    color: 'text-red-400',
  },
  {
    scenario: 'With Memory Engineering',
    monday: 'AI learns your project',
    tuesday: 'Continues from yesterday',
    wednesday: 'Suggests improvements',
    thursday: 'Knows all patterns',
    friday: 'Ship to production! 🚀',
    icon: CheckCircle,
    color: 'text-green-400',
  },
];

export default function MemoryPersistence() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="memory" className="py-20 px-4 bg-gradient-to-b from-gray-900 via-blue-950/5 to-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">PERSISTENT MEMORY</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            Your AI Never Forgets
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Close your laptop on Monday, open it on Friday - your AI picks up 
            EXACTLY where you left off. No context lost. Ever.
          </p>
        </motion.div>

        {/* Memory Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">How Memory Persists Across Sessions</h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-500 via-blue-500 to-green-500" />
            
            {/* Timeline items */}
            <div className="space-y-8">
              {memoryFlow.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className="w-1/2" />
                  
                  {/* Center icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.status === 'success' ? 'bg-green-500' :
                      item.status === 'updated' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pl-8' : 'pr-8 text-right'}`}>
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                      <div className="text-sm text-gray-400 mb-1">{item.time}</div>
                      <div className="font-semibold text-white mb-1">
                        {item.memory === 'AI Remembers!' ? (
                          <span className="text-green-400">{item.memory}</span>
                        ) : (
                          <code className="text-blue-400">{item.memory}</code>
                        )}
                      </div>
                      <div className="text-gray-300 text-sm">{item.content}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Week Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">One Week of Development</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {comparisonData.map((data, index) => (
              <motion.div
                key={data.scenario}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${
                  data.scenario === 'With Memory Engineering' 
                    ? 'border-green-500/50' 
                    : 'border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold">{data.scenario}</h4>
                  <data.icon className={`w-6 h-6 ${data.color}`} />
                </div>
                
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                    <div key={day} className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400 capitalize w-20">{day}:</span>
                      <span className="text-gray-300 text-sm">{data[day as keyof typeof data]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Memory Update Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-8 border border-purple-500/30"
        >
          <h3 className="text-2xl font-bold text-center mb-8">The activeContext Magic</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Every 3-5 Minutes</h4>
              <p className="text-gray-400 text-sm">
                Update what you're working on. AI tracks your progress continuously.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">MongoDB Persistence</h4>
              <p className="text-gray-400 text-sm">
                Every thought, decision, and learning saved forever in Atlas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Instant Recall</h4>
              <p className="text-gray-400 text-sm">
                Next session starts with full context. Zero repetition needed.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.8, type: 'spring' }}
              className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold text-lg">Never Lose Context Again</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-300 mb-6">
            Your AI assistant becomes your long-term development partner.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
