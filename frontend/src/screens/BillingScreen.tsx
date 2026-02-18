import React from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface BillingScreenProps {
  onNavigate: (view: ViewState) => void;
}

const invoices = [
  { id: 'inv_901', date: 'Oct 24, 2026', amount: '$12.00', status: 'Paid' },
  { id: 'inv_877', date: 'Sep 24, 2026', amount: '$12.00', status: 'Paid' },
  { id: 'inv_843', date: 'Aug 24, 2026', amount: '$12.00', status: 'Paid' }
];

export const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-sm text-gray-400 mt-1">Manage plan, invoices, and payment methods.</p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate('pricing')}>Compare Plans</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current subscription</p>
            <h2 className="text-2xl font-bold text-white mt-1">Pro Monthly</h2>
            <p className="text-sm text-gray-400">Renews on Nov 24, 2026</p>
          </div>
          <div className="p-5 flex flex-wrap gap-3">
            <Button className="h-10 px-5">Change Plan</Button>
            <Button variant="secondary" className="h-10 px-5">Update Payment Method</Button>
            <button className="h-10 px-5 border border-red-500/40 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">Cancel Subscription</button>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-5 border border-white/10">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Usage this cycle</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Batches</span><span className="text-white">42</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Items</span><span className="text-white">318</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Bandwidth</span><span className="text-white">124 GB</span></div>
          </div>
        </section>
      </div>

      <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h3 className="text-white font-semibold">Invoice history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5">
                  <td className="px-5 py-4 text-gray-300">{invoice.date}</td>
                  <td className="px-5 py-4 text-white">{invoice.amount}</td>
                  <td className="px-5 py-4"><span className="text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{invoice.status}</span></td>
                  <td className="px-5 py-4 text-right"><button className="text-primary hover:text-red-400">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
