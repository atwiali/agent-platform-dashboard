import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
          <Search className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-4xl font-bold gradient-text">404</h2>
          <p className="text-lg font-semibold mt-2">Page not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Home className="h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
