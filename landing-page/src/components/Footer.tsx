'use client';

import { Brain, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Performance', href: '#performance' },
      { label: 'Demo', href: '#demo' },
      { label: 'Installation', href: '#installation' },
    ],
    resources: [
      { label: 'Documentation', href: 'https://github.com/romiluz13/memory-engineering-mcp/blob/main/README.md' },
      { label: 'Troubleshooting', href: 'https://github.com/romiluz13/memory-engineering-mcp/blob/main/docs/TROUBLESHOOTING.md' },
      { label: 'GitHub', href: 'https://github.com/romiluz13/memory-engineering-mcp' },
      { label: 'npm Package', href: 'https://www.npmjs.com/package/memory-engineering-mcp' },
    ],
    community: [
      { label: 'GitHub Issues', href: 'https://github.com/romiluz13/memory-engineering-mcp/issues' },
      { label: 'Discussions', href: 'https://github.com/romiluz13/memory-engineering-mcp/discussions' },
      { label: 'Contributing', href: 'https://github.com/romiluz13/memory-engineering-mcp/blob/main/CONTRIBUTING.md' },
      { label: 'Changelog', href: 'https://github.com/romiluz13/memory-engineering-mcp/blob/main/CHANGELOG.md' },
    ],
  };

  const socials = [
    { icon: Github, href: 'https://github.com/romiluz13', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contact@example.com', label: 'Email' },
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-8 h-8 text-blue-500" />
              <span className="font-bold text-xl">Memory Engineering MCP</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Give your AI assistants persistent memory across sessions. 
              Never lose context again.
            </p>
            <div className="flex space-x-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <social.icon className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Community</h4>
            <ul className="space-y-2">
              {links.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Version Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2">
            <span className="text-sm text-blue-400">v13.3.2</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">Production Ready</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-green-400">✓ Meta-Tested</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} Memory Engineering MCP. All rights reserved.
            </p>
            <p className="flex items-center space-x-1 text-gray-400 text-sm">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by the open source community</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
