import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

export interface LPOData {
  lpoNumber: string;
  projectTitle: string;
  projectDescription: string;
  contractorName: string;
  contractorId: string;
  bidAmount: number;
  estimatedDuration: number;
  reportId: string;
  projectId: string;
  issuedBy: string;
  issuedDate: string;
  validUntil: string;
  location?: string;
}

export class LPOGenerationService {
  /**
   * Generate LPO number in format: LPO-YYYY-XXXXX
   */
  static generateLPONumber(): string {
    const year = new Date().getFullYear();
    const seq = Math.floor(10000 + Math.random() * 90000);
    return `LPO-${year}-${seq}`;
  }

  /**
   * Format currency for display
   */
  static formatKES(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Generate and download LPO PDF
   */
  static async generateLPO(data: LPOData): Promise<boolean> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      // Header - Government of Kenya branding
      doc.setFillColor(0, 82, 33); // Kenya green
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REPUBLIC OF KENYA', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(11);
      doc.text('UHURU SAFI - Government Infrastructure Management', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('LOCAL PURCHASE ORDER (LPO)', pageWidth / 2, 30, { align: 'center' });

      y = 45;

      // LPO Details box
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 82, 33);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, contentWidth, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`LPO Number: ${data.lpoNumber}`, margin + 5, y + 8);
      doc.text(`Date Issued: ${new Date(data.issuedDate).toLocaleDateString('en-KE')}`, margin + 5, y + 16);
      doc.text(`Valid Until: ${new Date(data.validUntil).toLocaleDateString('en-KE')}`, pageWidth / 2, y + 8);
      doc.text(`Project ID: ${data.projectId.substring(0, 8)}...`, pageWidth / 2, y + 16);

      y += 35;

      // Contractor Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ISSUED TO (CONTRACTOR)', margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contractor: ${data.contractorName}`, margin, y); y += 6;
      doc.text(`Contractor ID: ${data.contractorId.substring(0, 8)}...`, margin, y); y += 12;

      // Project Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT DETAILS', margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Title: ${data.projectTitle}`, margin, y); y += 6;
      
      // Word-wrap description
      const descLines = doc.splitTextToSize(`Description: ${data.projectDescription}`, contentWidth);
      doc.text(descLines, margin, y);
      y += descLines.length * 5 + 4;
      
      if (data.location) {
        doc.text(`Location: ${data.location}`, margin, y); y += 6;
      }
      doc.text(`Estimated Duration: ${data.estimatedDuration} days`, margin, y); y += 12;

      // Financial Details Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL DETAILS', margin, y);
      y += 8;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', margin + 3, y + 6);
      doc.text('Amount (KES)', pageWidth - margin - 3, y + 6, { align: 'right' });
      y += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.rect(margin, y, contentWidth, 8);
      doc.text('Contract Value (Winning Bid)', margin + 3, y + 6);
      doc.text(this.formatKES(data.bidAmount), pageWidth - margin - 3, y + 6, { align: 'right' });
      y += 8;

      const vat = data.bidAmount * 0.16;
      doc.rect(margin, y, contentWidth, 8);
      doc.text('VAT (16%)', margin + 3, y + 6);
      doc.text(this.formatKES(vat), pageWidth - margin - 3, y + 6, { align: 'right' });
      y += 8;

      // Total
      doc.setFillColor(0, 82, 33);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL CONTRACT VALUE', margin + 3, y + 7);
      doc.text(this.formatKES(data.bidAmount + vat), pageWidth - margin - 3, y + 7, { align: 'right' });
      y += 20;

      // Terms
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS', margin, y);
      y += 7;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const terms = [
        '1. Work must commence within 14 days of LPO issuance.',
        '2. All work must comply with Kenya Bureau of Standards (KEBS) requirements.',
        '3. Payment is milestone-based through the Uhuru Safi escrow system.',
        '4. Quality inspections will be conducted at each milestone.',
        '5. The contractor must maintain insurance and safety standards throughout the project.',
        '6. Non-compliance may result in contract termination and blacklisting.',
        '7. Disputes will be resolved through the Uhuru Safi dispute resolution mechanism.'
      ];
      terms.forEach(term => {
        doc.text(term, margin, y); y += 5;
      });
      y += 10;

      // Signature lines
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      const sigY = y;
      doc.text('Authorized Government Official', margin, sigY);
      doc.line(margin, sigY + 15, margin + 60, sigY + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Signature & Stamp', margin, sigY + 20);
      doc.text(`Date: ${new Date(data.issuedDate).toLocaleDateString('en-KE')}`, margin, sigY + 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Contractor Acceptance', pageWidth / 2 + 10, sigY);
      doc.line(pageWidth / 2 + 10, sigY + 15, pageWidth - margin, sigY + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Signature & Company Stamp', pageWidth / 2 + 10, sigY + 20);
      doc.text('Date: _______________', pageWidth / 2 + 10, sigY + 25);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFillColor(0, 82, 33);
      doc.rect(0, footerY - 5, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(
        'This is an official document generated by the Uhuru Safi Platform. Tampering is a criminal offense under the Kenya Public Procurement Act.',
        pageWidth / 2, footerY + 2, { align: 'center' }
      );
      doc.text(
        `Generated: ${new Date().toISOString()} | Blockchain verification available at platform`,
        pageWidth / 2, footerY + 7, { align: 'center' }
      );

      // Save
      doc.save(`LPO_${data.lpoNumber}.pdf`);
      return true;
    } catch (error) {
      console.error('LPO generation error:', error);
      return false;
    }
  }

  /**
   * Create LPO record in database and generate PDF
   */
  static async createAndDownloadLPO(
    reportId: string,
    projectId: string,
    bidId: string
  ): Promise<boolean> {
    try {
      // Get bid details
      const { data: bid } = await supabase
        .from('contractor_bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (!bid) throw new Error('Bid not found');

      // Get contractor name
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('company_name')
        .eq('user_id', bid.contractor_id)
        .single();

      // Get report/project details
      const { data: report } = await supabase
        .from('problem_reports')
        .select('title, description, location')
        .eq('id', reportId)
        .single();

      if (!report) throw new Error('Report not found');

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const lpoNumber = this.generateLPONumber();
      const issuedDate = new Date().toISOString();
      const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      // Save LPO record to database
      await supabase.from('local_purchase_orders').insert({
        lpo_number: lpoNumber,
        project_id: projectId,
        contractor_id: bid.contractor_id,
        issued_by: user.id,
        description: report.description,
        total_amount: bid.bid_amount,
        issued_at: issuedDate,
        valid_until: validUntil,
        status: 'issued',
        terms_conditions: 'Standard Kenya Public Procurement Act terms apply.'
      });

      // Generate PDF
      const success = await this.generateLPO({
        lpoNumber,
        projectTitle: report.title,
        projectDescription: report.description,
        contractorName: contractor?.company_name || 'Contractor',
        contractorId: bid.contractor_id,
        bidAmount: bid.bid_amount,
        estimatedDuration: bid.estimated_duration,
        reportId,
        projectId,
        issuedBy: user.id,
        issuedDate,
        validUntil,
        location: report.location || undefined
      });

      return success;
    } catch (error) {
      console.error('LPO creation error:', error);
      return false;
    }
  }
}
