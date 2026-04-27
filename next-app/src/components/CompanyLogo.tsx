import React, { useState } from 'react';

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string | null;
}

const CompanyLogo = ({ companyName, logoUrl }: CompanyLogoProps) => {
  const [hasError, setHasError] = useState(false);
  
  const initial = companyName ? companyName.charAt(0).toUpperCase() : '?';

  // Generate a consistent background color based on the company name
  const getBgColor = (name: string) => {
    if (!name) return 'bg-slate-500';
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (!logoUrl || hasError) {
    return (
      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm ${getBgColor(companyName)}`}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      className="w-10 h-10 shrink-0 rounded-lg object-contain bg-white border border-slate-100 p-1 shadow-sm"
      onError={() => setHasError(true)}
    />
  );
};

export default CompanyLogo;
