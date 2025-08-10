'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Play, Copy, Check } from 'lucide-react';

const demoCommands = [
  {
    id: 'init',
    title: 'Initialize Project',
    description: 'Set up memory system for a new project',
    commands: [
      { input: 'memory-engineering init my-ai-project', output: '🧠 Initializing memory system...' },
      { input: '', output: '✓ MongoDB connected to Atlas cluster' },
      { input: '', output: '✓ Created 7 core memories' },
      { input: '', output: '✓ Vector search indexes configured' },
      { input: '', output: '🚀 Project initialized with UUID: abc123...' },
    ],
  },
  {
    id: 'read',
    title: 'Read Memories',
    description: 'Retrieve all memories at session start',
    commands: [
      { input: 'memory-engineering readAll', output: '📚 Loading all memories...' },
      { input: '', output: '🟢 projectbrief: "Building AI assistant..."' },
      { input: '', output: '🟢 activeContext: "Working on feature X..."' },
      { input: '', output: '🟢 systemPatterns: "MVC architecture..."' },
      { input: '', output: '✓ All 7 memories loaded (45ms)' },
    ],
  },
  {
    id: 'update',
    title: 'Update Context',
    description: 'Save progress and learnings',
    commands: [
      { input: 'memory-engineering update activeContext "Completed auth system"', output: '⚡ Updating memory...' },
      { input: '', output: '✓ activeContext updated successfully' },
      { input: '', output: '📊 Version: v12' },
      { input: '', output: '⏱️ Timestamp: 2025-01-10T17:15:00Z' },
      { input: '', output: '💡 Next: Update every 3-5 minutes!' },
    ],
  },
  {
    id: 'search',
    title: 'Semantic Search',
    description: 'Find code by meaning',
    commands: [
      { input: 'memory-engineering search "authentication flow"', output: '🔍 Searching memories and code...' },
      { input: '', output: '✓ Found 5 relevant results:' },
      { input: '', output: '  1. auth.service.ts (95% match)' },
      { input: '', output: '  2. systemPatterns memory (87% match)' },
      { input: '', output: '  3. login.component.tsx (82% match)' },
    ],
  },
  {
    id: 'sync',
    title: 'Sync Codebase',
    description: 'Generate embeddings for semantic search',
    commands: [
      { input: 'memory-engineering syncCode "**/*.{ts,js}"', output: '🔄 Syncing codebase...' },
      { input: '', output: '📁 Found 147 files' },
      { input: '', output: '🧩 Creating semantic chunks...' },
      { input: '', output: '✓ Generated 523 embeddings' },
      { input: '', output: '🎯 Code search ready (8.2s)' },
    ],
  },
];

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState(demoCommands[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [copied, setCopied] = useState(false);

  const playDemo = () => {
    setIsPlaying(true);
    setCurrentLine(0);
    
    const interval = setInterval(() => {
      setCurrentLine((prev) => {
        if (prev >= activeDemo.commands.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const copyCommand = () => {
    const command = activeDemo.commands[0].input;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="demo" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Interactive examples showing how Memory Engineering MCP transforms your AI development workflow.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Demo Selector */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Choose a Demo</h3>
            {demoCommands.map((demo) => (
              <motion.button
                key={demo.id}
                onClick={() => {
                  setActiveDemo(demo);
                  setCurrentLine(0);
                  setIsPlaying(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  activeDemo.id === demo.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50'
                    : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold text-white">{demo.title}</div>
                <div className="text-sm text-gray-400 mt-1">{demo.description}</div>
              </motion.button>
            ))}
          </div>

          {/* Terminal Demo */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <Terminal className="w-4 h-4 text-gray-400 ml-4" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyCommand}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={playDemo}
                    disabled={isPlaying}
                    className={`flex items-center space-x-2 px-3 py-1 rounded ${
                      isPlaying
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } transition-colors`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              <div className="p-6 font-mono text-sm min-h-[300px]">
                <AnimatePresence>
                  {activeDemo.commands.map((cmd, index) => (
                    <motion.div
                      key={`${activeDemo.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: index <= currentLine || !isPlaying ? 1 : 0,
                        x: index <= currentLine || !isPlaying ? 0 : -20
                      }}
                      transition={{ duration: 0.3 }}
                      className="mb-2"
                    >
                      {cmd.input && (
                        <div className="flex items-start">
                          <span className="text-green-400 mr-2">$</span>
                          <span className="text-white">{cmd.input}</span>
                        </div>
                      )}
                      {cmd.output && (
                        <div className={`${cmd.output.startsWith('✓') ? 'text-green-400' : 
                                        cmd.output.startsWith('🟢') ? 'text-green-400' :
                                        cmd.output.startsWith('  ') ? 'text-gray-500' :
                                        'text-gray-400'} ml-4`}>
                          {cmd.output}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isPlaying && (
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-white ml-4"
                  />
                )}
              </div>
            </div>

            {/* Code Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Integration Example</h4>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`// In your Cursor settings.json
"mcpServers": {
  "memory-engineering": {
    "command": "npx",
    "args": ["memory-engineering-mcp"]
  }
}`}</code>
              </pre>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
