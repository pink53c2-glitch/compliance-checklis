export interface ComplianceQuestion {
  id: string;
  question_number: number;
  tool_category: string;
  created_at: string;
  question_text: string;
  affiliate_link?: string | null;
}