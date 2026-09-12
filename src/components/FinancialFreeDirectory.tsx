import React, { useState, useEffect } from "react";
import { Search, UserPlus, FileDown, X, Phone, MapPin, Tag, RefreshCw, CheckCircle2 } from "lucide-react";
import { Person } from "../types";
import { api, localVault, FF_PEOPLE_DIRECTORY_KEY } from "../lib/api";
import { exportPeopleDirectoryPdf } from "../lib/pdfExport";

const INITIAL_PEOPLE = [
  {
    id: "1",
    name: "Rohan Verma",
    category: "General",
    status: "Pending",
    amount: 5000,
    phone: "9876543210",
    city: "Mumbai"
  }
];

interface FinancialFreeDirectoryProps {
  onSelectPerson?: (personId: string) => void;
  onRefreshParent?: () => void;
}

export default function FinancialFreeDirectory({ onSelectPerson, onRefreshParent }: FinancialFreeDirectoryProps) {
  // 1. Initialize state directly from localStorage so data persists
  const [people, setPeople] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(FF_PEOPLE_DIRECTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Check local vault
      const vaultPeople = localVault.getPeople();
      if (vaultPeople.length > 0) {
        return vaultPeople.map(p => ({
          id: p.id,
          name: p.full_name,
          category: p.category || "General",
          status: p.status || "Pending",
          amount: p.total_given || p.remaining_balance || 0,
          phone: p.phone || "",
          city: p.address || ""
        }));
      }
      return INITIAL_PEOPLE;
    } catch (e) {
      console.error("Failed to load people from localStorage", e);
      return INITIAL_PEOPLE;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Friends",
    status: "Pending",
    amount: "",
    phone: "",
    city: ""
  });

  // 2. Sync to localStorage and API
  useEffect(() => {
    try {
      localStorage.setItem(FF_PEOPLE_DIRECTORY_KEY, JSON.stringify(people));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [people]);

  // Form submission handler
  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount) return;

    setIsSubmitting(true);
    const newPersonLocal = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category,
      status: formData.status,
      amount: Number(formData.amount),
      phone: formData.phone.trim(),
      city: formData.city.trim()
    };

    setPeople((prev) => [newPersonLocal, ...prev]);

    // Also persist into system API and cloud Firestore
    try {
      await api.createPerson({
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.city.trim(),
        category: formData.category,
        status: formData.status as any,
        total_given: Number(formData.amount),
        remaining_balance: Number(formData.amount),
      });
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      console.warn("API person sync background notice:", err);
    } finally {
      setIsSubmitting(false);
    }

    // Reset and close modal
    setFormData({
      name: "",
      category: "Friends",
      status: "Pending",
      amount: "",
      phone: "",
      city: ""
    });
    setIsModalOpen(false);
  };

  // Filter logic
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);

    const matchesStatus =
      selectedStatus === "All Statuses" || p.status === selectedStatus;
    const matchesCategory =
      selectedCategory === "All Categories" || p.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleExportPdf = () => {
    try {
      // Map to Person type
      const mapped: Person[] = filteredPeople.map(p => ({
        id: p.id,
        user_id: 'default',
        full_name: p.name,
        phone: p.phone,
        address: p.city,
        category: p.category,
        status: p.status,
        total_given: p.amount,
        total_returned: 0,
        remaining_balance: p.amount,
        transaction_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      exportPeopleDirectoryPdf(mapped, {
        status: selectedStatus === 'All Statuses' ? 'all' : selectedStatus,
        category: selectedCategory === 'All Categories' ? 'all' : selectedCategory,
        search: searchQuery
      });
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="w-full text-slate-900 dark:text-white font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-700/80 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            FIN
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">FinancialFree Directory</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                <CheckCircle2 size={10} className="text-emerald-500" />
                Cloud + Local Vault Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Title Section */}
      <div className="mt-5">
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">
          DIRECTORY
        </p>
        <h2 className="text-2xl font-bold mt-1 tracking-tight">
          People ({filteredPeople.length})
        </h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
          Borrower contacts, categories, and personal financial balance profiles.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2.5 mt-4">
        <button
          type="button"
          onClick={handleExportPdf}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <FileDown size={14} />
          <span>Export Directory (PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <UserPlus size={14} />
          <span>Add Person</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mt-4">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, city..."
          className="w-full bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:border-blue-500 shadow-inner"
        />
      </div>

      {/* Filter Badges */}
      <div className="space-y-2 mt-3.5">
        {/* Status Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {["All Statuses", "Pending", "Partially Paid", "Cleared"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st
                  ? "bg-slate-800 dark:bg-gray-700/80 border-slate-700 dark:border-gray-500 text-white font-medium shadow-xs"
                  : "bg-white dark:bg-[#161b22] border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {["All Categories", "Friends", "Family", "General"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-500 text-white font-medium shadow-xs"
                  : "bg-white dark:bg-[#161b22] border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* People Card List */}
      <div className="mt-5 space-y-3">
        {filteredPeople.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-[#161b22]/50 border border-slate-200 dark:border-gray-800 rounded-2xl">
            <p className="text-slate-400 dark:text-gray-400 text-sm">No records found</p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <div
              key={person.id}
              className="bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                    {person.name ? person.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-white">
                      {person.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                      <span className="font-medium">{person.category}</span>
                      {person.city && <span>• {person.city}</span>}
                      {person.phone && <span>• {person.phone}</span>}
                    </div>
                  </div>
                </div>

                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  person.status === 'Cleared'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : person.status === 'Partially Paid'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {person.status || 'Pending'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-gray-400 uppercase tracking-wide">
                    Balance / Given
                  </span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    ₹{Number(person.amount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPerson && onSelectPerson(person.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 cursor-pointer transition-colors"
                >
                  View Statement
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-App Add Person Modal (Native inside HTML to prevent pop-up crash) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Person</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  Amount Given (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Friends">Friends</option>
                    <option value="Family">Family</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Cleared">Cleared</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  City (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-xs font-medium text-slate-700 dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw size={12} className="animate-spin" />}
                  <span>Save Person</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
