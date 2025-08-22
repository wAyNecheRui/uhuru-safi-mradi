import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';
import { BID_TEMPLATES, TEMPLATE_CATEGORIES, type BidTemplate } from '@/constants/bidTemplates';

const BidTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = selectedCategory === 'all' 
    ? BID_TEMPLATES 
    : BID_TEMPLATES.filter(template => template.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Infrastructure': return 'bg-blue-100 text-blue-800';
      case 'Water': return 'bg-cyan-100 text-cyan-800';
      case 'Construction': return 'bg-orange-100 text-orange-800';
      case 'Electrical': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Standardized Bid Templates
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Download professional bid templates to ensure consistency and completeness in your proposals.
          </p>
        </CardHeader>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {category === 'all' ? 'All Categories' : category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm">{template.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Template Sections:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map((section, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                  <span>Updated: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                  <span>{template.downloads} downloads</span>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found for the selected category.</p>
        </div>
      )}
    </div>
  );
};

export default BidTemplates;