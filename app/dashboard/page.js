'use client';
import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, IndianRupee, Calendar, Filter, X, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // or your icon library
export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({ total: 0, profit: 0, loss: 0, winRate: 0 });
  const [msg, setMsg] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 2; // change value to show more/less per page




  const [newTrade, setNewTrade] = useState({
    type: 'crypto',
    symbol: '',
    action: 'buy',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    strategy: 'swing'
  });


  useEffect(() => {
    calculateStats();
  }, [msg]);

  const calculateStats = () => {
    const completed = (msg ?? []).filter(t => t.exitPrice);
    const total = completed.length;
    let profit = 0;
    let wins = 0;

    completed.forEach(trade => {
      const pnl = (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * parseFloat(trade.quantity);
      const finalPnl = trade.action === 'sell' ? -pnl : pnl;
      profit += finalPnl;
      if (finalPnl > 0) wins++;
    });

    setStats({
      total,
      profit: profit.toFixed(2),
      loss: completed.filter(t => {
        const pnl = (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.quantity);
        return (t.action === 'sell' ? -pnl : pnl) < 0;
      }).length,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0
    });
  };


  const addTrade = async () => {
    if (!newTrade.symbol || !newTrade.quantity || !newTrade.entryPrice) return;

    setTrades([...trades, { ...newTrade, id: Date.now() }]);
    setNewTrade({
      type: 'crypto',
      symbol: '',
      action: 'buy',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      strategy: 'swing'
    });
    setShowModal(false);

    console.log(newTrade, " trades");

    const res = await fetch("http://localhost:5000/api/trades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newTrade)
    });

    const data = await res.json();
    console.log(data, " main code is here to start working");

  };


  const deleteTrade = async (id) => {

    console.log(id, "hjsdgfhjd");

    try {
      const tradeId = id._id || id;

      const response = await fetch(`http://localhost:5000/api/trades/${tradeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        throw new Error(errorData.message || 'Failed to delete trade');
      }

      setMsg((prevTrades = []) => prevTrades.filter(t => {
        const currentId = t._id || t.id;
        return currentId !== tradeId;
      }));

      setTrades((prevTrades = []) => prevTrades.filter(t => {
        const currentId = t._id || t.id;
        return currentId !== tradeId;
      }));

    } catch (error) {
      console.error('Delete trade error:', error);
      alert(`Unable to delete trade: ${error.message}`);
    }
  };



  const updateTrade = (id, field, value) => {
    setTrades(trades.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const filteredTrades = filterType === 'all'
    ? (msg ?? [])
    : (msg ?? []).filter(t => t.type === filterType);

  const getTypeColor = (type) => {
    const colors = {
      crypto: 'bg-purple-500',
      stock: 'bg-blue-500',
      nifty: 'bg-green-500',
      options: 'bg-orange-500',
      swing: 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-500';
  };





  const calculatePnL = (trade) => {
    if (!trade?.exitPrice) return null;
    const pnl = (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * parseFloat(trade.quantity);
    return trade.action === 'sell' ? -pnl : pnl;
  };



  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);

  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };




  const downloadExcel = () => {
    const sourceTrades = msg ?? [];
    if (sourceTrades.length === 0) {
      alert('No trades to export!');
      return;
    }

    // Prepare data for Excel
    const excelData = sourceTrades.map(trade => {
      const pnl = calculatePnL(trade);
      return {
        'Date': trade.date,
        'Type': trade.type.toUpperCase(),
        'Symbol': trade.symbol,
        'Action': trade.action.toUpperCase(),
        'Strategy': trade.strategy,
        'Quantity': trade.quantity,
        'Entry Price': parseFloat(trade.entryPrice),
        'Exit Price': trade.exitPrice ? parseFloat(trade.exitPrice) : 'Open',
        'P&L': pnl !== null ? parseFloat(pnl.toFixed(2)) : 'Open',
        'Notes': trade.notes || ''
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 12 }, // Symbol
      { wch: 8 },  // Action
      { wch: 10 }, // Strategy
      { wch: 10 }, // Quantity
      { wch: 12 }, // Entry Price
      { wch: 12 }, // Exit Price
      { wch: 12 }, // P&L
      { wch: 40 }  // Notes
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Trades', 'Value': stats.total },
      { 'Metric': 'Total P&L', 'Value': parseFloat(stats.profit) },
      { 'Metric': 'Win Rate (%)', 'Value': parseFloat(stats.winRate) },
      { 'Metric': 'Total Losses', 'Value': stats.loss },
      { 'Metric': 'Total Wins', 'Value': stats.total - stats.loss }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate filename with current date
    const filename = `trade-journal-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  // get request data from the backend


  useEffect(() => {
    fetch("http://localhost:5000/api/trades")
      .then(res => res.json())
      .then(data => setMsg(data.data))
      .catch(err => console.log(err));
  }, []);


  console.log(filteredTrades, "filteredTrades");


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-10 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Trade Journal
              </h1>
            </div>
            <p className="text-slate-300 text-lg font-light ml-5">Track your Crypto, Stocks, Nifty, Options & Swing trades</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadExcel}
              className="flex items-center gap-3 bg-slate-700/50 backdrop-blur border border-slate-600 px-6 py-3 rounded-xl hover:bg-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
            >
              <Download size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Export Excel</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="font-semibold">Add Trade</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Total Trades",
              value: stats.total,
              icon: Calendar,
              color: "blue",
              gradient: "from-blue-500/20 to-cyan-500/20"
            },
            {
              label: "Total P&L",
              value: `₹${stats.profit}`,
              icon: IndianRupee,
              color: parseFloat(stats.profit) >= 0 ? "green" : "red",
              gradient: parseFloat(stats.profit) >= 0 ? "from-green-500/20 to-emerald-500/20" : "from-red-500/20 to-orange-500/20"
            },
            {
              label: "Win Rate",
              value: `${stats.winRate}%`,
              icon: TrendingUp,
              color: "purple",
              gradient: "from-purple-500/20 to-pink-500/20"
            },
            {
              label: "Losses",
              value: stats.loss,
              icon: TrendingDown,
              color: "orange",
              gradient: "from-orange-500/20 to-amber-500/20"
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-2">{stat.label}</p>
                  <p className={`text-4xl font-bold ${stat.color === 'blue' ? 'text-blue-400' :
                      stat.color === 'green' ? 'text-green-400' :
                        stat.color === 'red' ? 'text-red-400' :
                          stat.color === 'purple' ? 'text-purple-400' :
                            'text-orange-400'
                    }`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/30 backdrop-blur-sm ${stat.color === 'blue' ? 'text-blue-400' :
                    stat.color === 'green' ? 'text-green-400' :
                      stat.color === 'red' ? 'text-red-400' :
                        stat.color === 'purple' ? 'text-purple-400' :
                          'text-orange-400'
                  }`}>
                  <stat.icon size={28} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-blue-400" />
            <span className="text-slate-300 font-semibold">Filter Trades</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'crypto', 'stock', 'nifty', 'options', 'swing'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-2.5 rounded-xl capitalize transition-all duration-300 font-medium ${filterType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:scale-105'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Trades List */}
        <div className="space-y-4">
          {filteredTrades?.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 backdrop-blur rounded-2xl border-2 border-dashed border-slate-700/50">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg mb-4">No trades found</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Add Your First Trade
              </button>
            </div>
          ) : (
            currentTrades?.map(trade => {
              const pnl = calculatePnL(trade);

              console.log(pnl , "pnlpnlpnl");
              

              return (
                <div
                  key={trade.id}
                  className="group bg-slate-800/30  backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 hover:bg-slate-700/30 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Trade Header */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`${getTypeColor(trade.type)} px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border`}>
                          {trade.type}
                        </span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                          {trade.symbol}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${trade.action === 'buy'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {trade.action.toUpperCase()}
                        </span>
                        <span className="text-slate-300 text-sm font-medium bg-slate-700/50 px-3 py-1.5 rounded-lg">
                          {trade.strategy}
                        </span>
                      </div>

                      {/* Trade Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: "Quantity", value: trade.quantity },
                          { label: "Entry Price", value: `₹${trade.entryPrice}` },
                          {
                            label: "Exit Price",
                            value: trade.exitPrice ? `₹${trade.exitPrice}` : (
                              <input
                                type="number" 
                                placeholder="Open"
                                className="bg-slate-700/50 border border-slate-600/50 px-3 py-1.5 rounded-lg w-28 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                onBlur={(e) => e.target.value && updateTrade(trade.id, 'exitPrice', e.target.value)}
                              />
                            )
                          },
                          { label: "Date", value: trade.date }
                        ].map((item, index) => (
                          <div key={index}>
                            <p className="text-slate-400 text-sm font-medium mb-1">{item.label}</p>
                            <div className="font-semibold text-white">{item.value}</div>
                          </div>
                        ))}
                      </div>



                      {/* Notes */}
                      {trade.notes && (
                        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                          <p className="text-slate-300 text-sm italic">📝 {trade.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* P&L and Actions */}
                    <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                      {pnl !== null && (
                        <div className={`text-right ${pnl >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                          }`}>
                          <p className="text-sm font-medium text-slate-400">P&L</p>
                          <p className="text-3xl font-bold tracking-tight">
                            ${pnl.toFixed(2)}
                          </p>
                          <div className={`w-12 h-1 rounded-full mt-2 ${pnl >= 0 ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                        </div>
                      )}
                      <button
                        onClick={() => deleteTrade(trade._id)}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-500/40 group"
                        title="Delete trade"
                      >
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enhanced Pagination */}
        {filteredTrades.length > tradesPerPage && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/50 text-white disabled:opacity-30 hover:bg-slate-600/50 transition-all duration-300 border border-slate-600/50"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentPage === page
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/50 text-white disabled:opacity-30 hover:bg-slate-600/50 transition-all duration-300 border border-slate-600/50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Enhanced Add Trade Modal */}
       
       
        {showModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-fadeIn">
    <div
      className="bg-slate-800/95 border border-slate-700/60 rounded-3xl p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-slideUp"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              New Trade Entry
            </h2>
          </div>
          <p className="text-slate-400 text-xs ml-10">Track your trading performance</p>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="p-1.5 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:scale-110 group"
        >
          <X size={18} className="text-slate-400 group-hover:text-white" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 relative">
        {['Basic', 'Details', 'Review'].map((step, index) => (
          <div key={step} className="flex flex-col items-center z-10">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${index === 0
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-400'
              }`}>
              {index + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${index === 0 ? 'text-blue-400' : 'text-slate-500'
              }`}>
              {step}
            </span>
          </div>
        ))}
        <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-700/50 -z-10">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-1/3 transition-all duration-500"></div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Trade Type, Symbol, Action */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-slate-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Trade Type
            </label>
            <select
              value={newTrade.type}
              onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value })}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 appearance-none cursor-pointer text-sm"
            >
              <option value="crypto" className="bg-slate-800">💰 Crypto</option>
              <option value="stock" className="bg-slate-800">📈 Stock</option>
              <option value="nifty" className="bg-slate-800">🌍 Nifty</option>
              <option value="options" className="bg-slate-800">⚡ Options</option>
              <option value="swing" className="bg-slate-800">🔄 Swing</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-slate-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Symbol
            </label>
            <input
              type="text"
              placeholder="BTC, AAPL..."
              value={newTrade.symbol}
              onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value.toUpperCase() })}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-slate-300 font-semibold">Action</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'buy', label: 'Buy', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
                { value: 'sell', label: 'Sell', color: 'bg-red-500/20 border-red-500/50 text-red-400' }
              ].map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setNewTrade({ ...newTrade, action: action.value })}
                  className={`py-2 rounded-lg border transition-all duration-300 font-semibold text-sm ${newTrade.action === action.value
                      ? `${action.color} scale-105 shadow-lg`
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Strategy, Quantity, Entry Price */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-slate-300 font-semibold">Strategy</label>
            <select
              value={newTrade.strategy}
              onChange={(e) => setNewTrade({ ...newTrade, strategy: e.target.value })}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 appearance-none cursor-pointer text-sm capitalize"
            >
              <option value="swing" className="bg-slate-800">🔄 Swing</option>
              <option value="day" className="bg-slate-800">📊 Day</option>
              <option value="scalp" className="bg-slate-800">⚡ Scalp</option>
              <option value="position" className="bg-slate-800">🎯 Position</option>
            </select>
          </div>

          {[
            {
              label: "Quantity",
              type: "number",
              placeholder: "100",
              value: newTrade.quantity,
              onChange: (e) => setNewTrade({ ...newTrade, quantity: e.target.value }),
              icon: "🔢"
            },
            {
              label: "Entry Price",
              type: "number",
              placeholder: "0.00",
              value: newTrade.entryPrice,
              onChange: (e) => setNewTrade({ ...newTrade, entryPrice: e.target.value }),
              icon: "💰"
            }
          ].map((field, index) => (
            <div key={index} className="space-y-1">
              <label className="block text-xs text-slate-300 font-semibold">{field.icon} {field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                min="0"
                className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm"
              />
            </div>
          ))}
        </div>

        {/* Row 3: Exit Price, Date, Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Exit Price",
              type: "number",
              placeholder: "0.00",
              value: newTrade.exitPrice,
              onChange: (e) => setNewTrade({ ...newTrade, exitPrice: e.target.value }),
              icon: "🎯",
              optional: true
            },
            {
              label: "Trade Date",
              type: "date",
              value: newTrade.date,
              onChange: (e) => setNewTrade({ ...newTrade, date: e.target.value }),
              icon: "📅"
            }
          ].map((field, index) => (
            <div key={index} className="space-y-1">
              <label className="block text-xs text-slate-300 font-semibold">
                {field.icon} {field.label}
                {field.optional && <span className="text-slate-500 text-xs ml-1">(Opt)</span>}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                min="0"
                className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm"
              />
            </div>
          ))}

          {/* Quick Actions in the third column */}
          <div className="space-y-1">
            <label className="block text-xs text-slate-300 font-semibold">💡 Quick Date</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Today', date: new Date().toISOString().split('T')[0] },
                { label: 'Yesterday', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setNewTrade({ ...newTrade, date: action.date })}
                  className="py-1.5 text-xs bg-slate-600/30 hover:bg-slate-600/50 rounded transition-colors duration-300 text-slate-300 hover:text-white border border-slate-600/50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes - Full width but compact */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-slate-300 font-semibold">📝 Trade Notes</label>
            <span className="text-xs text-slate-500">
              {newTrade.notes?.length || 0}/150
            </span>
          </div>
          <textarea
            placeholder="Trade rationale, market conditions, lessons..."
            value={newTrade.notes}
            onChange={(e) => {
              if (e.target.value.length <= 150) {
                setNewTrade({ ...newTrade, notes: e.target.value })
              }
            }}
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 h-20 resize-none text-sm"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Optional for learning</span>
            <span>{150 - (newTrade.notes?.length || 0)} left</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg font-semibold transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={addTrade}
            disabled={!newTrade.symbol || !newTrade.quantity || !newTrade.entryPrice}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group text-sm"
          >
            <div className="flex items-center justify-center gap-1">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Trade</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );

}