import Link from "next/link";
import { ArrowRight, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - in a real app, this would come from the database
const featuredLinks = [
  {
    id: "1",
    title: "Next.js Documentation",
    description: "The official Next.js documentation with guides, API reference, and examples.",
    url: "https://nextjs.org/docs",
    tags: ["nextjs", "react", "documentation"],
    clicks: 15420,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Tailwind CSS",
    description: "A utility-first CSS framework packed with classes that can be composed to build any design.",
    url: "https://tailwindcss.com",
    tags: ["css", "framework", "utility"],
    clicks: 8930,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Prisma Documentation",
    description: "Next-generation ORM for TypeScript & Node.js with type safety and auto-completion.",
    url: "https://www.prisma.io/docs",
    tags: ["database", "orm", "typescript"],
    clicks: 5670,
    createdAt: new Date("2024-01-25"),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">GitHub Links</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/create">Create Link</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Share Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Resources</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover and share the best links, tools, and resources. Built with Next.js and PostgreSQL for lightning-fast performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/create">
                Share Your Link <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/explore">Explore Links</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Links */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Featured Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {link.title}
                    </CardTitle>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                  <CardDescription className="text-sm">
                    {link.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1">
                      {link.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {link.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{link.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <span>{link.clicks.toLocaleString()} clicks</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Links Shared</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Total Clicks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">1K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 GitHub Links. Built with Next.js and PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}
