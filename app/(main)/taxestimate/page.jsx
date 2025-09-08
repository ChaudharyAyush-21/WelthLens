"use client";
import React, { useState, useEffect } from 'react';

const IndianTaxEstimator = () => {
  const [formData, setFormData] = useState({
    annualIncome: '',
    filingStatus: 'individual',
    deductions: '',
    businessExpenses: '',
    investmentIncome: '',
    otherIncome: '',
    age: 'below60'
  });

  const [taxEstimate, setTaxEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Indian Income Tax Slabs for FY 2024-25 (Old Regime)
  const taxBrackets = {
    individual: [
      { min: 0, max: 250000, rate: 0.00 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 }
    ],
    senior: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 }
    ],
    superSenior: [
      { min: 0, max: 500000, rate: 0.00 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 }
    ]
  };

  // Standard deductions for Indian tax system
  const standardDeductions = {
    individual: 50000, // Standard deduction u/s 16(ia)
    senior: 50000,
    superSenior: 50000
  };

  // Section 80C and other deduction limits
  const deductionLimits = {
    section80C: 150000,
    section80D: 25000,
    section80DDB: 40000,
    section80E: 'unlimited',
    section80G: 'varies'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateIncomeTax = (taxableIncome, category) => {
    const brackets = taxBrackets[category] || taxBrackets.individual;
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const taxableAtThisLevel = Math.min(
        remainingIncome,
        bracket.max - bracket.min
      );

      tax += taxableAtThisLevel * bracket.rate;
      remainingIncome -= taxableAtThisLevel;
    }

    return tax;
  };

  const calculateCess = (tax) => {
    // Health and Education Cess @ 4% on Income Tax
    return tax * 0.04;
  };

  const getTaxCategory = (age, income) => {
    if (age === 'above80') return 'superSenior';
    if (age === 'above60') return 'senior';
    return 'individual';
  };

  const estimateTax = () => {
    setLoading(true);
    
    try {
      const income = parseFloat(formData.annualIncome) || 0;
      const businessExpenses = parseFloat(formData.businessExpenses) || 0;
      const investmentIncome = parseFloat(formData.investmentIncome) || 0;
      const otherIncome = parseFloat(formData.otherIncome) || 0;
      const deductions = parseFloat(formData.deductions) || 0;

      // Calculate total income
      const totalIncome = income + investmentIncome + otherIncome;
      const netBusinessIncome = Math.max(0, income - businessExpenses);

      // Get tax category based on age
      const taxCategory = getTaxCategory(formData.age, totalIncome);

      // Calculate taxable income after standard deduction
      const standardDeduction = standardDeductions[taxCategory];
      const totalDeductions = standardDeduction + deductions;
      const taxableIncome = Math.max(0, totalIncome - totalDeductions);

      // Calculate income tax
      const incomeTax = calculateIncomeTax(taxableIncome, taxCategory);
      
      // Calculate cess
      const cess = calculateCess(incomeTax);
      
      // Total tax liability
      const totalTax = incomeTax + cess;

      // Calculate quarterly estimates (for advance tax)
      const quarterlyPayment = totalTax / 4;

      // Calculate effective tax rate
      const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

      // Tax savings potential (80C limit)
      const maxDeductionPossible = deductionLimits.section80C;
      const currentDeductions = deductions;
      const additionalSavings = Math.max(0, maxDeductionPossible - currentDeductions);
      const potentialTaxSaving = additionalSavings * (getTaxRate(taxableIncome, taxCategory));

      setTaxEstimate({
        totalIncome: totalIncome,
        taxableIncome: taxableIncome,
        incomeTax: incomeTax,
        cess: cess,
        totalTax: totalTax,
        quarterlyPayment: quarterlyPayment,
        effectiveRate: effectiveRate,
        standardDeduction: standardDeduction,
        totalDeductions: totalDeductions,
        taxCategory: taxCategory,
        potentialSaving: potentialTaxSaving,
        additionalDeductionPossible: additionalSavings
      });
    } catch (error) {
      console.error('Tax calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaxRate = (income, category) => {
    const brackets = taxBrackets[category] || taxBrackets.individual;
    for (const bracket of brackets) {
      if (income >= bracket.min && income < bracket.max) {
        return bracket.rate;
      }
    }
    return 0.30; // Highest rate
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const resetForm = () => {
    setFormData({
      annualIncome: '',
      filingStatus: 'individual',
      deductions: '',
      businessExpenses: '',
      investmentIncome: '',
      otherIncome: '',
      age: 'below60'
    });
    setTaxEstimate(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Indian Tax Estimator</h2>
        <p className="text-gray-600">
          Calculate your Indian Income Tax for FY 2024-25 (All amounts in INR ₹)
        </p>
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            <strong>Disclaimer:</strong> This is an estimate based on Old Tax Regime for FY 2024-25. 
            Consult a chartered accountant for accurate calculations.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Income *
            </label>
            <input
              type="number"
              name="annualIncome"
              value={formData.annualIncome}
              onChange={handleInputChange}
              placeholder="Enter your annual income in ₹"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Category *
            </label>
            <select
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="below60">Below 60 years</option>
              <option value="above60">60-80 years (Senior Citizen)</option>
              <option value="above80">Above 80 years (Super Senior Citizen)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Expenses (if self-employed)
            </label>
            <input
              type="number"
              name="businessExpenses"
              value={formData.businessExpenses}
              onChange={handleInputChange}
              placeholder="Enter business expenses in ₹"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Income
            </label>
            <input
              type="number"
              name="investmentIncome"
              value={formData.investmentIncome}
              onChange={handleInputChange}
              placeholder="Dividends, capital gains, etc. in ₹"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Income
            </label>
            <input
              type="number"
              name="otherIncome"
              value={formData.otherIncome}
              onChange={handleInputChange}
              placeholder="Rental, freelance, etc. in ₹"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Deductions (80C, 80D, etc.)
            </label>
            <input
              type="number"
              name="deductions"
              value={formData.deductions}
              onChange={handleInputChange}
              placeholder="PF, ELSS, Insurance, etc. in ₹"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Standard deduction of ₹{standardDeductions.individual.toLocaleString('en-IN')} will be applied automatically
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Max 80C limit: ₹{deductionLimits.section80C.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={estimateTax}
              disabled={loading || !formData.annualIncome}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tax Calculation Results</h3>
          
          {taxEstimate ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md border">
                <h4 className="font-medium text-gray-700 mb-2">Income Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Income:</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Deduction:</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.standardDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.totalDeductions - taxEstimate.standardDeduction)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Taxable Income:</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.taxableIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border">
                <h4 className="font-medium text-gray-700 mb-2">Tax Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.incomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health & Education Cess (4%):</span>
                    <span className="font-medium">{formatCurrency(taxEstimate.cess)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total Tax Liability:</span>
                    <span className="text-red-600">{formatCurrency(taxEstimate.totalTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Tax Rate:</span>
                    <span className="font-medium">{taxEstimate.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Advance Tax (Quarterly)</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(taxEstimate.quarterlyPayment)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  If tax liability exceeds ₹10,000, advance tax payment is mandatory
                </p>
              </div>

              {taxEstimate.additionalDeductionPossible > 0 && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Tax Saving Opportunity</h4>
                  <p className="text-sm text-green-700">
                    You can claim additional deductions of up to <strong>{formatCurrency(taxEstimate.additionalDeductionPossible)}</strong> under Section 80C
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Potential tax saving: <strong>{formatCurrency(taxEstimate.potentialSaving)}</strong>
                  </p>
                </div>
              )}

              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <p className="text-sm text-orange-700">
                  <strong>Popular 80C Investments:</strong> EPF, PPF, ELSS Mutual Funds, NSC, 
                  Tax Saver FDs, Life Insurance Premium, Home Loan Principal
                </p>
              </div>

              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> This calculation is based on the Old Tax Regime. 
                  New Tax Regime may offer different benefits. TDS and advance tax payments 
                  will reduce your final liability.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                Enter your income details and click "Calculate Tax" to see your Indian tax liability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndianTaxEstimator;