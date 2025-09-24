"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, Calendar, Tag, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Mock data - in a real app, this would come from the database
const mockLinks: Record<string, any> = {
  "nextjs-documentation": {
    id: "1",
    title: "Next.js Documentation",
    description: "The official Next.js documentation with guides, API reference, and examples. This comprehensive resource covers everything from getting started to advanced features like Server Components, API routes, and deployment strategies.",
    url: "https://nextjs.org/docs",
    slug: "nextjs-documentation",
    image: "https://nextjs.org/static/images/learn.png",
    tags: ["nextjs", "react", "documentation", "web-development", "javascript"],
    clicks: 15420,
    isPublic: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    userId: "user1",
  },
  "tailwind-css": {
    id: "2",
    title: "Tailwind CSS",
    description: "A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
    url: "https://tailwindcss.com",
    slug: "tailwind-css",
    image: "https://tailwindcss.com/_next/static/media/tailwindcss-mark.cb8046c163f771c2c4b8c978c170beb.svg",
    tags: ["css", "framework", "utility", "design-system"],
    clicks: 8930,
    isPublic: true,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    userId: "user1",
  },
};

export default function LinkDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [link, setLink] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchLink = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const foundLink = mockLinks[slug];
      if (foundLink) {
        setLink(foundLink);
        // Increment click count (in real app, this would be done on the server)
        foundLink.clicks += 1;
      }
      setIsLoading(false);
    };

    if (slug) {
      fetchLink();
    }
  }, [slug]);

  const handleVisitLink = () => {
    if (link) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/link/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading link...</p>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Link Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">The link you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Go Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          {link.image && (
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <div className="text-6xl">🔗</div>
            </div>
          )}

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-4">{link.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(link.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {link.clicks.toLocaleString()} views
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {link.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {link.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={handleVisitLink} className="flex-1" size="lg">
                <ExternalLink className="mr-2 h-5 w-5" />
                Visit Link
              </Button>
              <Button variant="outline" onClick={handleCopyLink} size="lg">
                <Copy className="mr-2 h-5 w-5" />
                {copied ? "Copied!" : "Share"}
              </Button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Original URL</h4>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {link.url}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}