"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TokenFiltersProps {
  onFilterChange: (filters: {
    search: string;
    launchType: string;
    status: string;
    sortBy: string;
  }) => void;
}

export function TokenFilters({ onFilterChange }: TokenFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    // In a real app, you'd maintain filter state and call onFilterChange
    console.log(`Filter ${key} changed to ${value}`);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            className="pl-10"
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Launch Type */}
        <Select onValueChange={(value) => handleFilterChange("launchType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Launch Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project-raise">Project Raise</SelectItem>
            <SelectItem value="instant-launch">Instant Launch</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select onValueChange={(value) => handleFilterChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select onValueChange={(value) => handleFilterChange("sortBy", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="market-cap">Market Cap</SelectItem>
            <SelectItem value="volume">Volume 24h</SelectItem>
            <SelectItem value="price-change">Price Change</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}