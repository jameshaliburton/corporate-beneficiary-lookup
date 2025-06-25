import React, { useState } from 'react';

export interface ManualEntryFormProps {
  productName?: string;
  brandName?: string;
  companyName?: string;
  country?: string;
  onSubmit?: (data: any) => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ productName, brandName, companyName, country, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(companyName || '');
  const [countryVal, setCountry] = useState(country || '');

  if (!open) {
    return (
      <div className="flex justify-center my-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          onClick={() => setOpen(true)}
        >
          📝 Manual Entry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-base flex items-center gap-2">📝 Manual Entry</div>
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
      <form
        className="space-y-3"
        onSubmit={e => {
          e.preventDefault();
          onSubmit && onSubmit({ productName, brandName, companyName: company, country: countryVal });
        }}
      >
        <div>
          <label className="block text-xs text-gray-500 mb-1">Product Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
            value={productName}
            disabled
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Brand Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
            value={brandName}
            disabled
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter company name"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Country</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter country"
            value={countryVal}
            onChange={e => setCountry(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Re-run Search
        </button>
      </form>
    </div>
  );
};

export default ManualEntryForm; 