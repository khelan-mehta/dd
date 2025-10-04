import { Injectable } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { ExpenseCategory } from '../expense/entities/expense.entity';

@Injectable()
export class OcrService {
  async extractReceiptData(file: Express.Multer.File) {
    try {
      const result = await Tesseract.recognize(file.buffer, 'eng');
      const text = result.data.text;

      return {
        amount: this.extractAmount(text),
        currency: this.extractCurrency(text),
        date: this.extractDate(text),
        merchantName: this.extractMerchantName(text),
        category: this.categorizeExpense(text),
        description: this.extractDescription(text),
        lineItems: this.extractLineItems(text),
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      return this.getDefaultOcrData();
    }
  }

  private extractAmount(text: string): number {
    const amountRegex = /(?:total|amount|sum)[:\s]*[\$€£₹]?\s*(\d+[\.,]\d{2})/i;
    const match = text.match(amountRegex);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  }

  private extractCurrency(text: string): string {
    const currencySymbols = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
    for (const [symbol, code] of Object.entries(currencySymbols)) {
      if (text.includes(symbol)) return code;
    }
    return 'USD';
  }

  private extractDate(text: string): Date {
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
    const match = text.match(dateRegex);
    return match ? new Date(match[1]) : new Date();
  }

  private extractMerchantName(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    return lines[0]?.trim() || 'Unknown Merchant';
  }

  private categorizeExpense(text: string): ExpenseCategory {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('hotel') || lowerText.includes('accommodation')) {
      return ExpenseCategory.ACCOMMODATION;
    }
    if (lowerText.includes('restaurant') || lowerText.includes('food')) {
      return ExpenseCategory.FOOD;
    }
    if (lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('transport')) {
      return ExpenseCategory.TRANSPORTATION;
    }
    return ExpenseCategory.OTHER;
  }

  private extractDescription(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).join(' ').substring(0, 200);
  }

  private extractLineItems(text: string): any[] {
    const lines = text.split('\n');
    const items: any[] = [];
    
    for (const line of lines) {
      const itemRegex = /(.+?)\s+(\d+[\.,]\d{2})/;
      const match = line.match(itemRegex);
      if (match) {
        items.push({
          description: match[1].trim(),
          amount: parseFloat(match[2].replace(',', '.')),
        });
      }
    }
    
    return items;
  }

  private getDefaultOcrData() {
    return {
      amount: 0,
      currency: 'USD',
      date: new Date(),
      merchantName: 'Unknown',
      category: ExpenseCategory.OTHER,
      description: 'OCR processing failed',
      lineItems: [],
    };
  }
}