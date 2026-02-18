import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';

interface BillingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <h1 className="text-2xl font-bold text-white">Subscription</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Plan Card */}
        <div className="md:col-span-2 space-y-8">
             <div className="glass-card p-8 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Current Plan</p>
                   <h2 className="text-3xl font-bold text-white mb-2">Pro Annual</h2>
                   <p className="text-xl text-primary font-medium mb-1">$120 / year</p>
                   <p className="text-sm text-gray-500 mb-8">Renews on November 24, 2026</p>
                   
                   <div className="flex flex-wrap gap-4">
                      <Button className="w-auto px-6">Change Plan</Button>
                      <button className="px-6 py-2 border border-red-500/50 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors h-12">
                        Cancel Subscription
                      </button>
                   </div>
                </div>
             </div>

             <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                   <h3 className="font-semibold text-white">Invoice History</h3>
                </div>
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-white/5 text-gray-500">
                       <tr>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Amount</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 text-right font-medium">Invoice</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {[1,2,3].map((i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                             <td className="px-6 py-4">Oct 24, 2026</td>
                             <td className="px-6 py-4 text-white">$12.00</td>
                             <td className="px-6 py-4"><span className="text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Paid</span></td>
                             <td className="px-6 py-4 text-right">
                                <button className="text-gray-400 hover:text-white"><span className="material-symbols-outlined text-lg">download</span></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Pricing Summary / Right Col */}
        <div className="space-y-8">
           <div className="glass-card p-6 rounded-xl">
              <h3 className="font-semibold text-white mb-4">Pricing Summary</h3>
              <div className="space-y-3 mb-6">
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pro Plan (Yearly)</span>
                    <span className="text-white">$120.00</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">VAT (20%)</span>
                    <span className="text-white">$24.00</span>
                 </div>
                 <div className="h-px bg-white/10 my-2"></div>
                 <div className="flex justify-between text-base font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">$144.00</span>
                 </div>
              </div>
              <Button variant="secondary" fullWidth className="text-xs">Update Payment Method</Button>
           </div>
        </div>

      </div>
    </div>
  );
};