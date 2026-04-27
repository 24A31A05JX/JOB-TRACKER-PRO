export function formatSalary(salaryStr: string | null | undefined): string {
  if (!salaryStr) return '';
  
  // Clean string and try to match standard Indian tech salary formats
  const cleanStr = salaryStr.trim();
  const lpaMatch = cleanStr.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?)/i);
  
  if (lpaMatch && lpaMatch[1]) {
    const lpaAmount = parseFloat(lpaMatch[1]);
    const monthlyCost = (lpaAmount * 100000) / 12;
    
    // Format the monthly cost beautifully
    const formattedMonthly = monthlyCost >= 100000 
      ? `₹${(monthlyCost / 100000).toFixed(2).replace(/\.00$/, '')}L/mo`
      : `₹${Math.round(monthlyCost / 1000)}k/mo`;
      
    // Return original string with the contextual monthly rate appending
    return `${cleanStr} (${formattedMonthly})`;
  }

  return cleanStr;
}
