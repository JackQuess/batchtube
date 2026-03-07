import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function TermsOfServicePage() {
  useEffect(() => {
    applySeoMeta({ title: 'Terms of Service | BatchTube', description: 'BatchTube terms of service and use.' });
  }, []);

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-app-muted space-y-6">
          <p>Last updated: March 7, 2026</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the BatchTube service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
          <p>
            BatchTube provides a platform for downloading and processing media from various online sources. You understand and agree that the service is provided &quot;AS-IS&quot; and that BatchTube assumes no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Conduct</h2>
          <p>
            You agree to use the service only for lawful purposes. You are prohibited from using the service to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Download copyrighted material without permission from the copyright holder.</li>
            <li>Distribute malware, viruses, or any other harmful code.</li>
            <li>Interfere with or disrupt the service or servers connected to the service.</li>
            <li>Attempt to gain unauthorized access to any part of the service.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are and will remain the exclusive property of BatchTube and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
