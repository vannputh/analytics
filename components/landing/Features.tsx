"use client"

import { Film, BarChart3, Sparkles, UtensilsCrossed, Cloud, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Film,
    title: "Media Tracking",
    description: "Track movies, TV shows, books, games, podcasts, and live theatre with rich metadata",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize your consumption patterns with interactive charts and detailed KPIs",
  },
  {
    icon: Sparkles,
    title: "AI Queries",
    description: "Ask natural language questions about your watch history and get instant insights",
  },
  {
    icon: UtensilsCrossed,
    title: "Food Journal",
    description: "Track restaurant visits, meals, and culinary experiences with ratings and photos",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Access your data anywhere with secure cloud storage and real-time synchronization",
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Built with modern technologies for a blazing fast, responsive experience",
  },
]

export function Features() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-sans">
            Everything you need
          </h2>
          <p className="text-lg text-muted-foreground font-mono max-w-2xl mx-auto">
            Powerful features to track, analyze, and remember all your media consumption
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card 
                key={feature.title}
                className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] duration-300"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-sans">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
