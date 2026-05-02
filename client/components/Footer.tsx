import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("relative w-full overflow-hidden bg-background text-foreground pt-16 pb-8 border-t border-border/50", className)}>
      {/* Background large text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.02]">
        <h1 className="text-[15vw] font-bold tracking-tighter uppercase text-foreground">
          AXON
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-foreground text-background p-1.5 rounded-md">
                <Hexagon size={24} fill="currentColor" />
              </div>
              <span className="font-bold text-xl tracking-tight">Axon</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Create your content with ease.
            </p>
            <div className="flex flex-col space-y-2 pt-4">
              <span className="text-sm text-muted-foreground">Made by <span className="font-medium text-foreground">Tanishq Sethi</span></span>
              <div className="flex items-center gap-4 text-muted-foreground">
                <a href="https://github.com/iamtanishqsethi" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                  <Github size={18} />
                  <span className="sr-only">GitHub</span>
                </a>
                <a href="https://linkedin.com/in/iamtanishqsethi" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                  <Linkedin size={18} />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Axon INC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
