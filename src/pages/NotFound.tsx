import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Surface 404s in dev for debugging; production logger silences debug.
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SEO
        title="Page not found — Uhuru Safi"
        description="The page you're looking for doesn't exist on Uhuru Safi. Return to the home page to continue tracking public projects across Kenya."
        canonicalPath={location.pathname}
      />
      <div className="text-center px-6">
        <h1 className="text-5xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/" className="text-primary hover:underline font-medium">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
