'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Senior AI Engineer',
    company: 'TechCorp',
    content: 'Memory Engineering MCP transformed how we work with AI. Our Claude assistant now remembers every architectural decision and coding pattern. Development speed increased 10x!',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'Sarah Johnson',
    role: 'Full Stack Developer',
    company: 'StartupXYZ',
    content: 'Finally, an AI that doesn\'t forget! I can pick up exactly where I left off, even weeks later. The semantic search is incredibly accurate.',
    rating: 5,
    avatar: '👩‍💻',
  },
  {
    name: 'Mike Rodriguez',
    role: 'Tech Lead',
    company: 'DevStudio',
    content: 'The 7-memory structure is genius. It captures everything important without becoming cluttered. MongoDB Atlas integration makes it scale effortlessly.',
    rating: 5,
    avatar: '👨‍💼',
  },
];

const stats = [
  { label: 'Active Users', value: '500+' },
  { label: 'Memories Stored', value: '50K+' },
  { label: 'Time Saved', value: '90%' },
  { label: 'Satisfaction', value: '98%' },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by Developers
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join hundreds of developers who've transformed their AI workflow with persistent memory.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <Quote className="w-8 h-8 text-blue-500/30 mb-4" />
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>

              <div className="flex items-center space-x-3">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border border-blue-500/30"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-300 mb-6">
            Ready to give your AI perfect memory?
          </p>
          <a
            href="#installation"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all transform hover:scale-105"
          >
            Start Building Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
