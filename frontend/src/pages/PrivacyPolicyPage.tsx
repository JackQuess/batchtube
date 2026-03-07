import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function PrivacyPolicyPage() {
  useEffect(() => {
    applySeoMeta({ title: 'Privacy Policy | BatchTube', description: 'BatchTube privacy policy and information practices.' });
  }, []);

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-app-muted space-y-6">
          <p>Last updated: March 7, 2026</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We may use the information we collect about you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our Services;</li>
            <li>Perform internal operations, including, for example, to prevent fraud and abuse of our Services;</li>
            <li>Send or facilitate communications between you and a delivery partner;</li>
            <li>Send you communications we think will be of interest to you;</li>
            <li>Personalize and improve the Services.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Sharing of Information</h2>
          <p>
            We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us;</li>
            <li>With the general public if you submit content in a public forum, such as blog comments, social media posts, or other features of our Services that are viewable by the general public;</li>
            <li>With third parties with whom you choose to let us share information.</li>
          </ul>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
