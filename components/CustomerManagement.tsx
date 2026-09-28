import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Customer } from '../types';
import { UserPlus, Trash2, Phone, Search, Users, Printer, LayoutGrid, BadgeCheck, UserCircle, Loader2, Upload, Copy, Check, Pencil, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_TYPES = ['Director', 'Local Client', 'Producer', 'Actor'];

const CustomerManagement: React.FC = () => {
  const { customers, addCustomer, deleteCustomer, toggleCustomerStatus, updateCustomer, currentUser, loadInitialData } = useAppStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('Local Client');
  const [typeInput, setTypeInput] = useState('Local Client');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState('');
  const [editTypeInput, setEditTypeInput] = useState('');
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const [printTarget, setPrintTarget] = useState<'registry' | 'single' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalType = typeInput.trim() || type;
    try {
      setLoading(true);
      await addCustomer({ name, phone, type: finalType });
      setName(''); setPhone(''); setType('Local Client'); setTypeInput('Local Client');
      alert('Partner enrolled successfully');
    } catch (error) {
      console.error("Failed to add customer", error);
      alert('Failed to enroll partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditType(c.type);
    setEditTypeInput(c.type);
    setShowEditTypeDropdown(false);
  };

  const handleEditSave = async () => {
    if (!editingCustomer) return;
    const finalType = editTypeInput.trim() || editType;
    if (!editName.trim()) { alert('Name is required'); return; }
    try {
      setEditLoading(true);
      await updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        type: finalType,
      });
      setEditingCustomer(null);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to update customer');
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleUploadProfile = async (customerId: string, file: File) => {
    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('image', file);
    try {
      setLoading(true);
      const uploadUrl = `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/customers/upload-profile.php`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mh_auth_token') || ''}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await loadInitialData(true);
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    ), [customers, search]);

  const initiateRegistryPrint = () => {
    setPrintTarget('registry');
    setTimeout(() => { window.print(); setPrintTarget(null); }, 500);
  };

  const initiateSinglePrint = (customer: any) => {
    setSelectedCustomer(customer);
    setPrintTarget('single');
    setTimeout(() => { window.print(); setPrintTarget(null); }, 500);
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => { setCopiedId((prev) => (prev === id ? null : prev)); }, 1200);
    } catch (e) {
      console.error('Failed to copy client id', e);
    }
  };

  // Filtered preset suggestions for type dropdowns
  const filteredPresets = (input: string) =>
    PRESET_TYPES.filter(t => t.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-0 sm:px-2">

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingCustomer(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Edit Partner</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">ID: {editingCustomer.id}</p>
                </div>
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+880..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Partner Class</label>
                  <input
                    value={editTypeInput}
                    onChange={e => { setEditTypeInput(e.target.value); setShowEditTypeDropdown(true); }}
                    onFocus={() => setShowEditTypeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEditTypeDropdown(false), 150)}
                    placeholder="Type or select..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner"
                  />
                  {showEditTypeDropdown && filteredPresets(editTypeInput).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                      {filteredPresets(editTypeInput).map(t => (
                        <button
                          key={t}
                          type="button"
                          onMouseDown={() => { setEditTypeInput(t); setEditType(t); setShowEditTypeDropdown(false); }}
                          className="w-full text-left px-6 py-3 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registry Print View */}
      {printTarget === 'registry' && (
        <div className="print-container bg-white text-black p-10 fixed inset-0 z-modal overflow-auto print:static print:inset-auto print:z-auto">
          <div className="max-w-[210mm] mx-auto space-y-10">
            <div className="border-b-4 border-indigo-600 pb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-indigo-600 tracking-tighter uppercase leading-none">MH Creation X</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">Official Client Registry Database</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900 uppercase">Records: {customers.length}</p>
                <p className="text-[9px] font-black uppercase text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Customer ID</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Full Name</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Phone</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Category</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-4 font-black text-sm">{c.id}</td>
                    <td className="py-4 font-bold text-sm uppercase">{c.name}</td>
                    <td className="py-4 font-bold text-sm">{c.phone}</td>
                    <td className="py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">{c.type}</td>
                    <td className="py-4 font-bold text-[9px] uppercase tracking-widest">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-20 text-center opacity-30">
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">Engineered by Moazzem Hossen • Internal Studio Document</p>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Print View */}
      {printTarget === 'single' && selectedCustomer && (
        <div className="print-container bg-white text-black p-20 fixed inset-0 z-modal flex items-center justify-center print:static print:inset-auto print:z-auto">
          <div className="w-[120mm] bg-white border-2 border-indigo-600 rounded-[3rem] p-12 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 opacity-5 -rotate-45 translate-x-12 -translate-y-12" />
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-indigo-600 tracking-tighter uppercase leading-none">MH Creation X</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Client Identification Pass</p>
              </div>
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl">
                {selectedCustomer.id.substring(0, 2)}
              </div>
            </div>
            <div className="space-y-6 py-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Official ID</span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{selectedCustomer.id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Holder Name</span>
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">Category</span>
                  <span className="text-xs font-black uppercase">{selectedCustomer.type}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">Validated</span>
                  <span className="text-xs font-black uppercase text-indigo-600">Studio Master</span>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">+880 1768 443633</p>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">mhcreationx@gmail.com</p>
              </div>
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Record Unique Ref: {selectedCustomer.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard UI - Hidden during print */}
      <div className="no-print space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight">Client Directory</h2>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">Verified Partner Records</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID or Name..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 font-bold shadow-sm outline-none focus:border-indigo-500 transition-all" />
            </div>
            <button
              onClick={initiateRegistryPrint}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-600 transition-all active:scale-95"
            >
              <Printer size={18} /> Print Registry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Quick Enroll Form */}
          <div className="glass p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] h-fit border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black mb-8 flex items-center gap-3">
              <UserPlus className="text-indigo-600" /> Quick Enroll
            </h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Moazzem Hossen" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone</label>
                  <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner" />
                </div>

                {/* Custom type combo input */}
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Partner Class</label>
                  <input
                    value={typeInput}
                    onChange={e => { setTypeInput(e.target.value); setShowTypeDropdown(true); }}
                    onFocus={() => setShowTypeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTypeDropdown(false), 150)}
                    placeholder="Type or select..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 shadow-inner"
                  />
                  {showTypeDropdown && filteredPresets(typeInput).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                      {filteredPresets(typeInput).map(t => (
                        <button
                          key={t}
                          type="button"
                          onMouseDown={() => { setTypeInput(t); setType(t); setShowTypeDropdown(false); }}
                          className="w-full text-left px-6 py-3 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 text-[10px] flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={14} /> : null}
                {loading ? 'Committing...' : 'Commit Identity'}
              </button>
            </form>
          </div>

          {/* Customer Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <AnimatePresence>
              {filtered.map(c => (
                <motion.div
                  layout
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`glass p-5 sm:p-6 lg:p-7 rounded-[2.2rem] sm:rounded-[2.6rem] border-2 transition-all relative overflow-hidden group hover:shadow-2xl ${c.isActive ? 'border-transparent' : 'border-rose-500/20 grayscale'}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 -rotate-45 translate-x-12 -translate-y-12" />

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl overflow-hidden shadow-lg border-2 border-white/40 dark:border-slate-900/40 bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      {c.profileImageUrl ? (
                        <img
                          src={resolveImageUrl(c.profileImageUrl)}
                          className="w-full h-full object-cover"
                          alt={c.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-lg sm:text-xl text-white">{c.id.substring(0, 2)}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button onClick={() => initiateSinglePrint(c)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all"><Printer size={16} /></button>
                      <button
                        onClick={() => handleCopyId(c.id)}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all"
                        title="Copy Partner ID"
                        aria-label="Copy Partner ID"
                      >
                        {copiedId === c.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      {/* Edit button - visible to all, or restrict to isAdmin if preferred */}
                      <button
                        onClick={() => openEdit(c)}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all"
                        title="Edit Partner"
                        aria-label="Edit Partner"
                      >
                        <Pencil size={16} />
                      </button>
                      {isAdmin && (
                        <label className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all cursor-pointer">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadProfile(c.id, file);
                            }}
                          />
                        </label>
                      )}
                      {isAdmin ? (
                        <button onClick={() => toggleCustomerStatus(c.id)} className={`px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest border transition-all whitespace-nowrap ${c.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {c.isActive ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest border whitespace-nowrap ${c.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {c.isActive ? 'ACTIVE' : 'DISABLED'}
                        </div>
                      )}
                      {isAdmin && <button onClick={async () => {
                        if (confirm('Delete customer?')) {
                          try {
                            await deleteCustomer(c.id);
                          } catch (e: any) {
                            alert(e.response?.data?.error || "Failed to delete customer");
                            console.error(e);
                          }
                        }
                      }} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>}
                    </div>
                  </div>

                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 break-words">{c.name}</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <BadgeCheck size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] break-all">Partner ID: {c.id}</span>
                  </div>

                  <div className="space-y-2.5 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <LayoutGrid size={14} className="text-indigo-600/50" />
                      <span>Group: {c.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <Phone size={14} className="text-indigo-600/50" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <UserCircle size={14} className="text-indigo-600/50" />
                      <span>Joined: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full py-24 text-center glass rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
                <Users size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No partners found in selected criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;