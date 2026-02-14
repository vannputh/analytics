"use client"

import { Button } from "@/components/ui/button"
import { Film, TrendingUp, Sparkles } from "lucide-react"

interface HeroProps {
  onRequestAccess: () => void
  onLogin: () => void
}

export function Hero({ onRequestAccess, onLogin }: HeroProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 animate-gradient" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Icon trio */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Film className="h-12 w-12 text-primary animate-float" style={{ animationDelay: '0s' }} />
          <TrendingUp className="h-16 w-16 text-primary animate-float" style={{ animationDelay: '0.2s' }} />
          <Sparkles className="h-12 w-12 text-primary animate-float" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-sans">
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Track your media.
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Analyze your habits.
          </span>
          <br />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Remember everything.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-mono">
          Your personal media consumption tracker with powerful analytics and AI-powered insights
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            onClick={onRequestAccess}
            className="w-full sm:w-auto font-mono text-sm uppercase tracking-wider px-8"
          >
            Request Access
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={onLogin}
            className="w-full sm:w-auto font-mono text-sm uppercase tracking-wider px-8"
          >
            Login
          </Button>
        </div>

        {/* Stats or social proof */}
        <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="space-y-2">
            <p className="text-3xl font-bold font-mono">∞</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Entries</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold font-mono">6</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Media Types</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold font-mono">AI</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Powered</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        :global(.animate-gradient) {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        
        :global(.animate-float) {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
