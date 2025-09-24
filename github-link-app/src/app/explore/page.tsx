"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ExternalLink, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

// Mock data - in a real app, this would come from the database
const mockLinks = [
  {
    id: "1",
    title: "Next.js Documentation",
    description: "The official Next.js documentation with guides, API reference, and examples.",
    url: "https://nextjs.org/docs",
    slug: "nextjs-documentation",
    tags: ["nextjs", "react", "documentation"],
    clicks: 15420,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Tailwind CSS",
    description: "A utility-first CSS framework packed with classes that can be composed to build any design.",
    url: "https://tailwindcss.com",
    slug: "tailwind-css",
    tags: ["css", "framework", "utility"],
    clicks: 8930,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Prisma Documentation",
    description: "Next-generation ORM for TypeScript & Node.js with type safety and auto-completion.",
    url: "https://www.prisma.io/docs",
    slug: "prisma-documentation",
    tags: ["database", "orm", "typescript"],
    clicks: 5670,
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    title: "React Router",
    description: "Declarative routing for React applications.",
    url: "https://reactrouter.com",
    slug: "react-router",
    tags: ["react", "routing", "navigation"],
    clicks: 3420,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "5",
    title: "TypeScript Handbook",
    description: "The official TypeScript handbook with language reference and examples.",
    url: "https://www.typescriptlang.org/docs/",
    slug: "typescript-handbook",
    tags: ["typescript", "javascript", "documentation"],
    clicks: 12890,
    createdAt: new Date("2024-02-05"),
  },
];

const allTags = Array.from(new Set(mockLinks.flatMap(link => link.tags)));

export default function Explore() {
  const [links, setLinks] = useState(mockLinks);
  const [filteredLinks, setFilteredLinks] = useState(mockLinks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest");

  useEffect(() => {
    let filtered = links.filter(link =>
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedTags.length > 0) {
      filtered = filtered.filter(link =>
        selectedTags.some(tag => link.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "popular":
          return b.clicks - a.clicks;
        default:
          return 0;
      }
    });

    setFilteredLinks(filtered);
  }, [links, searchTerm, selectedTags, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Links
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Discover amazing resources shared by the community
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search links, descriptions, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                  Filter by tags:
                </span>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {(searchTerm || selectedTags.length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredLinks.length} of {links.length} links
          </p>
        </div>

        {/* Links Grid */}
        {filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No links found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {link.title}
                    </CardTitle>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 ml-2" />
                  </div>
                  <CardDescription className="text-sm line-clamp-3">
                    {link.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(link.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {link.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {link.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {link.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{link.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                  >
                    <Link href={`/link/${link.slug}`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}