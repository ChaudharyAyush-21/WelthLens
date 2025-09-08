"use client";
import React, { useState, useEffect, useMemo } from 'react';

const BudgetPlanner = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const [timeframe, setTimeframe] = useState('monthly');
  
  // Income data
  const [incomeData, setIncomeData] = useState({
    salary: '',
    freelance: '',
    investment: '',
    rental: '',
    other: ''
  });

  // Expense categories with default percentages based on 50/30/20 rule
  const [expenseData, setExpenseData] = useState({
    housing: { amount: '', percentage: 25, category: 'needs' },
    utilities: { amount: '', percentage: 5, category: 'needs' },
    groceries: { amount: '', percentage: 10, category: 'needs' },
    transportation: { amount: '', percentage: 10, category: 'needs' },
    insurance: { amount: '', percentage: 5, category: 'needs' },
    healthcare: { amount: '', percentage: 3, category: 'needs' },
    debt: { amount: '', percentage: 5, category: 'needs' },
    dining: { amount: '', percentage: 8, category: 'wants' },
    entertainment: { amount: '', percentage: 5, category: 'wants' },
    shopping: { amount: '', percentage: 7, category: 'wants' },
    subscriptions: { amount: '', percentage: 3, category: 'wants' },
    hobbies: { amount: '', percentage: 4, category: 'wants' },
    travel: { amount: '', percentage: 5, category: 'wants' },
    emergency: { amount: '', percentage: 10, category: 'savings' },
    retirement: { amount: '', percentage: 10, category: 'savings' },
    investments: { amount: '', percentage: 5, category: 'savings' }
  });

  const [budgetGoals, setBudgetGoals] = useState({
    emergencyFundMonths: 6,
    savingsRate: 20,
    debtToIncomeRatio: 30
  });

  // Calculate totals
  const calculations = useMemo(() => {
    const totalIncome = Object.values(incomeData).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    
    const expensesByCategory = {
      needs: 0,
      wants: 0,
      savings: 0
    };

    let totalExpenses = 0;
    Object.entries(expenseData).forEach(([key, data]) => {
      const amount = parseFloat(data.amount) || 0;
      totalExpenses += amount;
      expensesByCategory[data.category] += amount;
    });

    const surplus = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (expensesByCategory.savings / totalIncome) * 100 : 0;
    const needsPercentage = totalIncome > 0 ? (expensesByCategory.needs / totalIncome) * 100 : 0;
    const wantsPercentage = totalIncome > 0 ? (expensesByCategory.wants / totalIncome) * 100 : 0;

    // Convert to annual if monthly
    const multiplier = timeframe === 'monthly' ? 12 : 1;
    
    return {
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      surplus: surplus,
      expensesByCategory,
      savingsRate,
      needsPercentage,
      wantsPercentage,
      annualIncome: totalIncome * multiplier,
      annualExpenses: totalExpenses * multiplier,
      annualSurplus: surplus * multiplier
    };
  }, [incomeData, expenseData, timeframe]);

  const handleIncomeChange = (field, value) => {
    setIncomeData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseChange = (field, value) => {
    setExpenseData(prev => ({
      ...prev,
      [field]: { ...prev[field], amount: value }
    }));
  };

  const autoFillBudget = () => {
    const totalIncome = calculations.totalIncome;
    if (totalIncome === 0) return;

    const newExpenseData = { ...expenseData };
    Object.keys(newExpenseData).forEach(key => {
      const suggestedAmount = (totalIncome * newExpenseData[key].percentage) / 100;
      newExpenseData[key] = { ...newExpenseData[key], amount: suggestedAmount.toFixed(0) };
    });
    setExpenseData(newExpenseData);
  };

  const resetBudget = () => {
    setIncomeData({
      salary: '',
      freelance: '',
      investment: '',
      rental: '',
      other: ''
    });
    setExpenseData(prev => {
      const reset = { ...prev };
      Object.keys(reset).forEach(key => {
        reset[key] = { ...reset[key], amount: '' };
      });
      return reset;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getHealthStatus = () => {
    const { needsPercentage, wantsPercentage, savingsRate } = calculations;
    
    if (needsPercentage <= 50 && wantsPercentage <= 30 && savingsRate >= 20) {
      return { status: 'excellent', color: 'green', message: 'Excellent! Following the 50/30/20 rule' };
    } else if (needsPercentage <= 60 && savingsRate >= 10) {
      return { status: 'good', color: 'blue', message: 'Good budget allocation' };
    } else if (needsPercentage <= 70 && savingsRate >= 5) {
      return { status: 'fair', color: 'yellow', message: 'Room for improvement' };
    } else {
      return { status: 'poor', color: 'red', message: 'Consider budget adjustments' };
    }
  };

  const budgetHealth = getHealthStatus();

  const ProgressBar = ({ label, current, target, color = 'blue' }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{current.toFixed(1)}% / {target}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Budget Planner & Financial Analysis</h2>
        <p className="text-gray-600">
          Plan your budget, track expenses, and analyze your financial health (All amounts in INR ₹)
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'planner' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Budget Planner
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analysis' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Financial Analysis
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'goals' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Financial Goals
        </button>
      </div>

      {/* Timeframe Selector */}
      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {activeTab === 'planner' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Income Section */}
          <div className="lg:col-span-1">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                {timeframe === 'monthly' ? 'Monthly' : 'Annual'} Income
              </h3>
              <div className="space-y-4">
                {Object.entries({
                  salary: 'Salary/Wages',
                  freelance: 'Freelance',
                  investment: 'Investment Income',
                  rental: 'Rental Income',
                  other: 'Other Income'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={incomeData[key]}
                      onChange={(e) => handleIncomeChange(key, e.target.value)}
                      placeholder="Enter amount in ₹"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}
                <div className="pt-4 border-t border-green-200">
                  <div className="flex justify-between font-semibold text-green-800">
                    <span>Total Income:</span>
                    <span>{formatCurrency(calculations.totalIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="lg:col-span-2">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-800">
                  {timeframe === 'monthly' ? 'Monthly' : 'Annual'} Expenses
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={autoFillBudget}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Auto-Fill
                  </button>
                  <button
                    onClick={resetBudget}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Needs */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Needs (50% recommended)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(expenseData)
                    .filter(([_, data]) => data.category === 'needs')
                    .map(([key, data]) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')} ({data.percentage}%)
                      </label>
                      <input
                        type="number"
                        value={data.amount}
                        onChange={(e) => handleExpenseChange(key, e.target.value)}
                        placeholder="Enter amount in ₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Wants */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Wants (30% recommended)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(expenseData)
                    .filter(([_, data]) => data.category === 'wants')
                    .map(([key, data]) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')} ({data.percentage}%)
                      </label>
                      <input
                        type="number"
                        value={data.amount}
                        onChange={(e) => handleExpenseChange(key, e.target.value)}
                        placeholder="Enter amount in ₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Savings & Investments (20% recommended)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(expenseData)
                    .filter(([_, data]) => data.category === 'savings')
                    .map(([key, data]) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')} ({data.percentage}%)
                      </label>
                      <input
                        type="number"
                        value={data.amount}
                        onChange={(e) => handleExpenseChange(key, e.target.value)}
                        placeholder="Enter amount in ₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-red-200">
                <div className="flex justify-between font-semibold text-red-800">
                  <span>Total Expenses:</span>
                  <span>{formatCurrency(calculations.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Budget Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Income:</span>
                  <span className="font-medium text-green-600">{formatCurrency(calculations.totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-medium text-red-600">{formatCurrency(calculations.totalExpenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">
                    {calculations.surplus >= 0 ? 'Surplus:' : 'Deficit:'}
                  </span>
                  <span className={`font-bold ${calculations.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(calculations.surplus))}
                  </span>
                </div>
              </div>
            </div>

            <div className={`bg-${budgetHealth.color}-50 p-6 rounded-lg border border-${budgetHealth.color}-200`}>
              <h3 className={`text-lg font-semibold text-${budgetHealth.color}-800 mb-2`}>
                Budget Health: {budgetHealth.status.toUpperCase()}
              </h3>
              <p className={`text-${budgetHealth.color}-700`}>{budgetHealth.message}</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Needs</span>
                    <span className="text-sm">{formatCurrency(calculations.expensesByCategory.needs)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(calculations.expensesByCategory.needs / calculations.totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Wants</span>
                    <span className="text-sm">{formatCurrency(calculations.expensesByCategory.wants)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(calculations.expensesByCategory.wants / calculations.totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Savings</span>
                    <span className="text-sm">{formatCurrency(calculations.expensesByCategory.savings)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(calculations.expensesByCategory.savings / calculations.totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Ratios */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Financial Ratios</h3>
              <ProgressBar 
                label="Needs Ratio" 
                current={calculations.needsPercentage} 
                target={50} 
                color="red" 
              />
              <ProgressBar 
                label="Wants Ratio" 
                current={calculations.wantsPercentage} 
                target={30} 
                color="orange" 
              />
              <ProgressBar 
                label="Savings Rate" 
                current={calculations.savingsRate} 
                target={20} 
                color="green" 
              />
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Annual Projection</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Annual Income:</span>
                  <span className="font-medium">{formatCurrency(calculations.annualIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Expenses:</span>
                  <span className="font-medium">{formatCurrency(calculations.annualExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Savings:</span>
                  <span className="font-medium">{formatCurrency(calculations.expensesByCategory.savings * (timeframe === 'monthly' ? 12 : 1))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Net Worth Change:</span>
                  <span className={`font-bold ${calculations.annualSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculations.annualSurplus >= 0 ? '+' : ''}{formatCurrency(calculations.annualSurplus)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Quick Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Follow the 50/30/20 rule for balanced budgeting</li>
                <li>• Build an emergency fund of 3-6 months expenses</li>
                <li>• Review and adjust your budget monthly</li>
                <li>• Automate savings to ensure consistency</li>
                <li>• Track actual vs. planned expenses regularly</li>
                <li>• Consider Indian tax-saving investments (80C, ELSS, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Financial Goals */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Financial Goals</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Fund (months of expenses)
                  </label>
                  <input
                    type="number"
                    value={budgetGoals.emergencyFundMonths}
                    onChange={(e) => setBudgetGoals(prev => ({ ...prev, emergencyFundMonths: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Recommended: 3-6 months for most people, 6-12 for self-employed
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Savings Rate (%)
                  </label>
                  <input
                    type="number"
                    value={budgetGoals.savingsRate}
                    onChange={(e) => setBudgetGoals(prev => ({ ...prev, savingsRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Recommended: 20% minimum, 25%+ for early retirement
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Debt-to-Income Ratio (%)
                  </label>
                  <input
                    type="number"
                    value={budgetGoals.debtToIncomeRatio}
                    onChange={(e) => setBudgetGoals(prev => ({ ...prev, debtToIncomeRatio: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Recommended: Under 36% total debt, under 28% housing
                  </p>
                </div>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Goal Progress</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Emergency Fund Target</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(calculations.totalExpenses * budgetGoals.emergencyFundMonths)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {budgetGoals.emergencyFundMonths} months of expenses
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      At current savings rate: {calculations.savingsRate > 0 ? 
                        `${Math.ceil((calculations.totalExpenses * budgetGoals.emergencyFundMonths) / calculations.expensesByCategory.savings)} ${timeframe === 'monthly' ? 'months' : 'years'}` : 
                        'N/A (no savings allocated)'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Savings Rate Goal</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span>Current: {calculations.savingsRate.toFixed(1)}%</span>
                      <span>Target: {budgetGoals.savingsRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${calculations.savingsRate >= budgetGoals.savingsRate ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min((calculations.savingsRate / budgetGoals.savingsRate) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {calculations.savingsRate >= budgetGoals.savingsRate ? 
                        '✅ Goal achieved!' : 
                        `Need ${formatCurrency((calculations.totalIncome * budgetGoals.savingsRate / 100) - calculations.expensesByCategory.savings)} more in savings`
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Financial Health Score</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${
                        budgetHealth.status === 'excellent' ? 'bg-green-500' :
                        budgetHealth.status === 'good' ? 'bg-blue-500' :
                        budgetHealth.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium capitalize">{budgetHealth.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{budgetHealth.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPlanner;