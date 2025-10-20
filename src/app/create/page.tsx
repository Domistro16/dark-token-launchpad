"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Zap, Check } from "lucide-react";
import { useState } from "react";
import { ProjectRaiseModal } from "@/components/create/ProjectRaiseModal";
import { InstantLaunchModal } from "@/components/create/InstantLaunchModal";

export default function CreatePage() {
  const [selectedType, setSelectedType] = useState<"project-raise" | "instant-launch" | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Launch Type
            </h1>
            <p className="text-xl text-muted-foreground">
              Select the perfect launch model for your token
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Project Raise */}
            <Card className="p-8 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge>Recommended for Projects</Badge>
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Project Raise</h2>
                <p className="text-muted-foreground">
                  Raise $50k-$500k over 24 hours with structured vesting and liquidity management
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24-hour raise window ($50k-$500k target)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">20% owner allocation (10% immediate, 10% vested)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">10% liquidity pool (capped at $100k)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">2% trading fee (0.1% platform, 1.0% creator, 0.9% InfoFi)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Graduate to PancakeSwap at $500k market cap</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dedicated InfoFi dashboard and fee pool</span>
                </div>
              </div>

              <Button 
                className="w-full controller-btn" 
                size="lg"
                onClick={() => setSelectedType("project-raise")}
              >
                Launch Project Raise
              </Button>
            </Card>

            {/* Instant Launch */}
            <Card className="p-8 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Fast & Simple</Badge>
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Instant Launch</h2>
                <p className="text-muted-foreground">
                  Create and launch your token instantly with immediate trading
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Instant token creation and deployment</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">2% trading fee (0.1% platform, 1.0% creator, 0.9% InfoFi)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Graduate at $90k market cap</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Claim fees every 24h (if market cap maintained)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Tweet-bot integration for auto-creation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dedicated InfoFi dashboard</span>
                </div>
              </div>

              <Button 
                className="w-full controller-btn" 
                size="lg"
                onClick={() => setSelectedType("instant-launch")}
              >
                Launch Instantly
              </Button>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Feature Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4">Feature</th>
                    <th className="text-center py-3 px-4">Project Raise</th>
                    <th className="text-center py-3 px-4">Instant Launch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">Setup Time</td>
                    <td className="text-center py-3 px-4">~5 minutes</td>
                    <td className="text-center py-3 px-4 text-primary font-medium">~1 minute</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">Fundraising</td>
                    <td className="text-center py-3 px-4 text-primary font-medium">$50k-$500k</td>
                    <td className="text-center py-3 px-4">No fundraising</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Best For</td>
                    <td className="text-center py-3 px-4">Serious projects</td>
                    <td className="text-center py-3 px-4 text-primary font-medium">Meme coins</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedType === "project-raise" && (
        <ProjectRaiseModal 
          isOpen={true} 
          onClose={() => setSelectedType(null)} 
        />
      )}
      {selectedType === "instant-launch" && (
        <InstantLaunchModal 
          isOpen={true} 
          onClose={() => setSelectedType(null)} 
        />
      )}
    </div>
  );
}