import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Link2, Loader2, ThumbsUp, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimilarReport {
  id: string;
  title: string;
  location: string | null;
  status: string | null;
  status: string | null;
  category: string | null;
  created_at: string | null;
  photo_urls: string[] | null;
  description: string | null;
  similarity: 'high' | 'medium';
  verified_votes: number | null;
}

interface DuplicateReportDetectorProps {
  title: string;
  description: string;
  location: string;
  category: string;
  onLinkToExisting?: (reportId: string) => void;
}

const DuplicateReportDetector: React.FC<DuplicateReportDetectorProps> = ({
  title,
  description,
  location,
  category,
  onLinkToExisting
}) => {
  const [similarReports, setSimilarReports] = useState<SimilarReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (title.length < 10 || dismissed) return;

    const debounce = setTimeout(() => {
      detectDuplicates();
    }, 800);

    return () => clearTimeout(debounce);
  }, [title, location, category]);

  const detectDuplicates = async () => {
    setLoading(true);
    try {
      // Extract key words from the title (remove common words)
      const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'and', 'or', 'not', 'this', 'that', 'it', 'has',
        'have', 'been', 'our', 'we', 'they', 'there', 'here', 'which', 'what', 'when'
      ]);

      const combinedText = `${title} ${description}`.toLowerCase();

      const keywords = combinedText
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w))
        .slice(0, 8); // Gather top 8 keywords from title & description

      if (keywords.length === 0) {
        setSimilarReports([]);
        setLoading(false);
        return;
      }

      // Build OR filter for matching keywords in title or description
      const orFilters = keywords.map(kw => `title.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');

      let query = supabase
        .from('problem_reports')
        .select('id, title, description, location, status, category, created_at, verified_votes, photo_urls')
        .or(orFilters)
        .not('status', 'eq', 'rejected')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      // Also filter by same category if provided
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Duplicate detection error:', error);
        setSimilarReports([]);
        setLoading(false);
        return;
      }

      // Score and rank results
      const scored = (data || []).map(report => {
        let score = 0;
        const rTitle = report.title.toLowerCase();
        const rDesc = (report.description || '').toLowerCase();
        const rLocation = (report.location || '').toLowerCase();
        const inputLocation = location.toLowerCase();

        // Keyword match scoring in title and description
        keywords.forEach(kw => {
          if (rTitle.includes(kw)) score += 3;
          if (rDesc.includes(kw)) score += 2;
        });

        // Location proximity scoring (reduced weight)
        if (inputLocation && rLocation) {
          const locParts = inputLocation.split(',').map(p => p.trim().toLowerCase());
          const rLocParts = rLocation.split(',').map(p => p.trim().toLowerCase());

          locParts.forEach(part => {
            if (part && rLocParts.some(rp => rp.includes(part) || part.includes(rp))) {
              score += 1;
            }
          });
        }

        // Category match
        if (category && report.category === category) score += 1;

        const similarity: 'high' | 'medium' = score >= 8 ? 'high' : 'medium';

        return { ...report, similarity, _score: score };
      })
        .filter(r => r._score >= 4)
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);

      setSimilarReports(scored);
    } catch (error) {
      console.error('Duplicate detection error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || (similarReports.length === 0 && !loading)) return null;

  return (
    <Card className="border-yellow-300 bg-yellow-50/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
            <h4 className="text-sm font-semibold text-yellow-800">
              {loading ? 'Checking for similar reports...' : `${similarReports.length} similar report(s) found`}
            </h4>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-xs text-yellow-700">
            Dismiss
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Scanning existing reports...</span>
          </div>
        )}

        {!loading && similarReports.length > 0 && (
          <>
            <p className="text-xs text-yellow-700">
              These existing reports may describe the same issue. Consider voting on an existing report instead of creating a duplicate.
            </p>
            <div className="space-y-2">
              {similarReports.map(report => (
                <div key={report.id} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-yellow-200">
                  {report.photo_urls && report.photo_urls.length > 0 && (
                    <div className="shrink-0">
                      <img
                        src={report.photo_urls[0]}
                        alt="Report evidence"
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.title}</p>
                    {report.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">"{report.description}"</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {report.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{report.location}
                        </span>
                      )}
                      <Badge variant={report.similarity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {report.similarity === 'high' ? 'Very Similar' : 'Related'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{report.status}</Badge>
                      {(report.verified_votes || 0) > 0 && (
                        <span className="text-xs flex items-center gap-1 text-green-700">
                          <ThumbsUp className="h-3 w-3" />{report.verified_votes}
                        </span>
                      )}
                    </div>
                  </div>
                  {onLinkToExisting && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLinkToExisting(report.id)}
                      className="text-xs shrink-0"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Vote Instead
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DuplicateReportDetector;
