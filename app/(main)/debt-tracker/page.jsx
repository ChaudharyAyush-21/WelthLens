// "use client";
// import { useState, useEffect } from "react";
// import { createDebt, getUserDebts, markDebtPaid, exportDebtsCSV, exportDebtsExcel, exportDebtsPDF } from "@/actions/debt";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";

// export default function DebtManager({ userId }) {
//   const [debts, setDebts] = useState([]);
//   const [form, setForm] = useState({ type: "LOAN", amount: "", interestRate: "", dueDate: "", notes: "" });

//   useEffect(() => {
//     refreshDebts();
//   }, []);

//   async function refreshDebts() {
//     const res = await getUserDebts(userId);
//     setDebts(res);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     await createDebt({ userId, ...form });
//     setForm({ type: "LOAN", amount: "", interestRate: "", dueDate: "", notes: "" });
//     refreshDebts();
//   }

//   async function handleMarkPaid(id) {
//     await markDebtPaid(id);
//     refreshDebts();
//   }

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">💳 Debt Tracker</h2>

//       {/* Form */}
//       <form onSubmit={handleSubmit} className="grid gap-4 p-4 border rounded-lg shadow">
//         <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="p-2 border rounded">
//           <option value="LOAN">Loan</option>
//           <option value="EMI">EMI</option>
//           <option value="CREDIT_CARD">Credit Card</option>
//         </select>
//         <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="p-2 border rounded" />
//         <input type="number" step="0.1" placeholder="Interest Rate (%)" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} className="p-2 border rounded" />
//         <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="p-2 border rounded" />
//         <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="p-2 border rounded"></textarea>
//         <Button type="submit">Add Debt</Button>
//       </form>

//       {/* Export Options */}
//       <div className="flex gap-3 my-4">
//         <Button variant="outline" onClick={() => exportDebtsCSV(userId)}>Export CSV</Button>
//         <Button variant="outline" onClick={() => exportDebtsExcel(userId)}>Export Excel</Button>
//         <Button variant="outline" onClick={() => exportDebtsPDF(userId)}>Export PDF</Button>
//       </div>

//       {/* Debt List */}
//       <div className="grid gap-3">
//         {debts.map((d) => (
//           <Card key={d.id} className="shadow-md">
//             <CardContent className="flex justify-between items-center">
//               <div>
//                 <p className="font-semibold">{d.type} - ${d.amount}</p>
//                 <p className="text-sm text-gray-500">Due: {new Date(d.dueDate).toDateString()} | Status: {d.status}</p>
//               </div>
//               {d.status !== "PAID" && (
//                 <Button size="sm" onClick={() => handleMarkPaid(d.id)}>Mark Paid</Button>
//               )}
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  TrendingDown, 
  FileText, 
  Upload,
  Plus,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Target,
  PieChart,
  BarChart3,
  Receipt
} from 'lucide-react';
import { 
  createDebt, 
  getDebts, 
  getDebtAnalytics, 
  updateDebt, 
  deleteDebt, 
  addDebtPayment,
  exportDebtData,
  uploadDebtReceipt
} from '../actions/debt';

const DebtManager = () => {
  const [debts, setDebts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsResult, analyticsResult] = await Promise.all([
        getDebts(),
        getDebtAnalytics()
      ]);
      
      if (debtsResult.success) setDebts(debtsResult.debts);
      if (analyticsResult.success) setAnalytics(analyticsResult.analytics);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }
  
  const handleAddDebt = async (formData) => {
    const result = await createDebt(formData);
    if (result.success) {
      loadData();
      setShowAddDebt(false);
    }

  const handleAddPayment = async (formData) => {
    const result = await addDebtPayment(selectedDebt.id, formData);
    if (result.success) {
      loadData();
      setShowAddPayment(false);
      setSelectedDebt(null);
    }
  };

  const handleExport = async (format) => {
    const result = await exportDebtData(format);
    if (result.success) {
      const dataStr = JSON.stringify(result.data);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `debt-data.${format}`;
      link.click();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'PAID_OFF': return 'text-green-600 bg-green-100';
      case 'OVERDUE': return 'text-red-600 bg-red-100';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDebtTypeIcon = (type) => {
    switch (type) {
      case 'CREDIT_CARD': return <CreditCard className="w-5 h-5" />;
      case 'HOME_LOAN': return <Target className="w-5 h-5" />;
      case 'CAR_LOAN': return <Target className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Debt Management
            </h1>
            <p className="text-gray-600 mt-2">Track and manage all your debts, loans, and EMIs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddDebt(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Debt
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                <Download className="w-5 h-5" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left hover:bg-gray-50">CSV</button>
                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2 text-left hover:bg-gray-50">PDF</button>
                <button onClick={() => handleExport('excel')} className="w-full px-4 py-2 text-left hover:bg-gray-50">Excel</button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Debt</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">₹{analytics.totalDebt.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Paid</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">₹{analytics.totalPaid.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Debts</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.activeDebts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Monthly EMI</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">₹{analytics.monthlyPayments.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
          <div className="flex space-x-1">
            {['overview', 'analytics', 'receipts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Debt by Type Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Debt by Type
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.debtByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">{type.replace('_', ' ')}</span>
                    <span className="font-bold text-red-600">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Payment Progress
              </h3>
              <div className="space-y-4">
                {debts.slice(0, 5).map((debt) => {
                  const progress = ((parseFloat(debt.totalAmount) - parseFloat(debt.currentBalance)) / parseFloat(debt.totalAmount)) * 100;
                  return (
                    <div key={debt.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{debt.name}</span>
                        <span className="text-gray-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Summary Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{analytics.overdueDebts}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{analytics.paidOffDebts}</p>
                  <p className="text-sm text-gray-600">Paid Off</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{analytics.activeDebts}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(((analytics.totalPaid) / (analytics.totalDebt + analytics.totalPaid)) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Paid Ratio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Receipt Management
              </h3>
              <button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                <Upload className="w-4 h-4" />
                Upload Receipt
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Upload your receipts</h4>
              <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
              <p className="text-sm text-gray-500">Supports: PDF, JPG, PNG (Max 10MB)</p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sample receipt cards - replace with actual receipt data */}
                <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Credit Card Payment</p>
                      <p className="text-sm text-gray-600">2 days ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">₹5,000 payment receipt</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {debts.map((debt) => (
              <div key={debt.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      {getDebtTypeIcon(debt.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{debt.name}</h3>
                      <p className="text-sm text-gray-600">{debt.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(debt.status)}`}>
                    {debt.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Balance</span>
                    <span className="font-bold text-red-600">₹{parseFloat(debt.currentBalance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-medium">₹{parseFloat(debt.totalAmount).toLocaleString()}</span>
                  </div>
                  {debt.interestRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate</span>
                      <span className="font-medium">{debt.interestRate}%</span>
                    </div>
                  )}
                  {debt.minPayment && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Payment</span>
                      <span className="font-medium">₹{parseFloat(debt.minPayment).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(((parseFloat(debt.totalAmount) - parseFloat(debt.currentBalance)) / parseFloat(debt.totalAmount)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, ((parseFloat(debt.totalAmount) - parseFloat(debt.currentBalance)) / parseFloat(debt.totalAmount)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDebt(debt);
                      setShowAddPayment(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Add Payment
                  </button>
                  <button
                    onClick={() => setEditingDebt(debt)}
                    className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteDebt(debt.id).then(() => loadData())}
                    className="p-2 bg-red-100 rounded-xl hover:bg-red-200 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Debt Modal */}
        {showAddDebt && (
          <AddDebtModal
            onClose={() => setShowAddDebt(false)}
            onAdd={handleAddDebt}
          />
        )}

        {/* Add Payment Modal */}
        {showAddPayment && selectedDebt && (
          <AddPaymentModal
            debt={selectedDebt}
            onClose={() => {
              setShowAddPayment(false);
              setSelectedDebt(null);
            }}
            onAdd={handleAddPayment}
          />
        )}

        {/* Edit Debt Modal */}
        {editingDebt && (
          <EditDebtModal
            debt={editingDebt}
            onClose={() => setEditingDebt(null)}
            onUpdate={(data) => {
              updateDebt(editingDebt.id, data).then(() => {
                loadData();
                setEditingDebt(null);
              });
            }}
          />
        )}
      </div>
    </div>
  );
export default DebtManager;
const AddDebtModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CREDIT_CARD',
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minPayment: '',
    dueDate: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Debt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Credit Card, Home Loan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="PERSONAL_LOAN">Personal Loan</option>
              <option value="HOME_LOAN">Home Loan</option>
              <option value="CAR_LOAN">Car Loan</option>
              <option value="EDUCATION_LOAN">Education Loan</option>
              <option value="EMI">EMI</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="₹ 0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="₹ 0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Payment</label>
              <input
                type="number"
                step="0.01"
                value={formData.minPayment}
                onChange={(e) => setFormData({ ...formData, minPayment: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="₹ 0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Add Debt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Payment Modal Component
const AddPaymentModal = ({ debt, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800">{debt.name}</h3>
          <p className="text-sm text-gray-600">Current Balance: ₹{parseFloat(debt.currentBalance).toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="₹ 0.00"
              max={debt.currentBalance}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="3"
              placeholder="Payment notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Debt Modal Component
const EditDebtModal = ({ debt, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: debt.name,
    type: debt.type,
    totalAmount: debt.totalAmount.toString(),
    currentBalance: debt.currentBalance.toString(),
    interestRate: debt.interestRate ? debt.interestRate.toString() : '',
    minPayment: debt.minPayment ? debt.minPayment.toString() : '',
    dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
    description: debt.description || '',
    status: debt.status
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Debt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ACTIVE">Active</option>
              <option value="PAID_OFF">Paid Off</option>
              <option value="PAUSED">Paused</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Update Debt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};