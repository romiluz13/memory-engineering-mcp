'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal, Settings, Zap, ArrowRight } from 'lucide-react';

const installSteps = [
  {
    step: 1,
    title: 'Install the package',
    description: 'Global installation via npm',
    command: 'npm install -g memory-engineering-mcp',
    icon: Terminal,
  },
  {
    step: 2,
    title: 'Set up environment',
    description: 'Configure MongoDB and Voyage AI',
    command: `# Create .env.local file
MONGODB_URI=mongodb+srv://your-connection-string
VOYAGE_API_KEY=your-voyage-api-key`,
    icon: Settings,
  },
  {
    step: 3,
    title: 'Configure Cursor/Cline',
    description: 'Add to MCP servers config',
    command: `// In settings.json
"mcpServers": {
  "memory-engineering": {
    "command": "npx",
    "args": ["memory-engineering-mcp"]
  }
}`,
    icon: Zap,
  },
];

const requirements = [
  { label: 'Node.js', value: 'v20+', required: true },
  { label: 'MongoDB Atlas', value: 'Free tier works', required: true },
  { label: 'Voyage AI API', value: 'Get free key', required: true },
  { label: 'Cursor/Cline', value: 'MCP compatible', required: false },
];

export default function Installation() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="installation" className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Three simple steps to give your AI persistent memory. 
            Works with Cursor, Cline, and any MCP-compatible client.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Installation Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6">Quick Setup</h3>
            
            {installSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connection Line */}
                {index < installSteps.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-blue-500 to-transparent" />
                )}

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-1">
                      Step {step.step}: {step.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                    
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        <code>{step.command}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(step.command, index)}
                        className="mt-3 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy command</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Quick Start Button */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-6"
            >
              <a
                href="https://github.com/romiluz13/memory-engineering-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg transition-all transform hover:scale-105"
              >
                <span>View on GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

          {/* Requirements & Resources */}
          <div className="space-y-8">
            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-semibold mb-6">Requirements</h3>
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div
                    key={req.label}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        req.required ? 'bg-blue-400' : 'bg-gray-400'
                      }`} />
                      <span className="text-white">{req.label}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{req.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-6 border border-blue-500/30"
            >
              <h4 className="text-lg font-semibold mb-4">Helpful Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://www.mongodb.com/atlas/database" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                    <span>MongoDB Atlas Setup Guide</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.voyageai.com" target="_blank" rel="noopener noreferrer"
                     className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                    <span>Get Voyage AI API Key</span>
                  </a>
                </li>
                <li>
                  <a href="https://github.com/romiluz13/memory-engineering-mcp/blob/main/docs/TROUBLESHOOTING.md" 
                     target="_blank" rel="noopener noreferrer"
                     className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                    <span>Troubleshooting Guide</span>
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/30"
            >
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-green-400 mb-2">You're Ready!</h4>
              <p className="text-gray-400 text-sm">
                After setup, your AI will never forget project context again.
                Every session builds on the last one.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
