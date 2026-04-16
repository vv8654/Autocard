import { BottomNav } from '../../components/BottomNav';

export const metadata = { title: 'Privacy Policy — AutoCard' };

export default function PrivacyPage() {
  const updated = 'April 15, 2026';
  const appUrl  = 'https://autocard-nine.vercel.app';
  const contact = 'privacy@autocard.app';

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <h1 className="text-white text-2xl font-black">Privacy Policy</h1>
        <p className="text-indigo-200 text-sm mt-1">Last updated {updated}</p>
      </div>

      <div className="px-5 pt-6 space-y-6 text-sm text-gray-700 leading-relaxed">

        <section>
          <p>
            AutoCard (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a credit card recommendation tool
            that helps you get the most rewards on every purchase. This Privacy Policy explains what
            information we collect, how we use it, and your rights regarding that information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Information We Collect</h2>
          <p className="mb-2">
            <strong>Locally stored data.</strong> AutoCard stores all your preferences, card selections,
            recommendation history, and bonus tracking data <em>on your device only</em> using your
            browser&apos;s localStorage. This data never leaves your device unless you connect a bank
            account through Plaid.
          </p>
          <p>
            <strong>Location data.</strong> If you enable nearby business detection, AutoCard accesses
            your device&apos;s GPS coordinates solely to query OpenStreetMap&apos;s public Overpass API
            for nearby businesses. Your coordinates are never stored or transmitted to our servers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Plaid Financial Data</h2>
          <p className="mb-2">
            AutoCard uses <strong>Plaid</strong> to allow you to optionally connect your bank accounts
            and credit cards. When you connect an account:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Plaid retrieves your transaction history on your behalf (read-only access only).</li>
            <li>We never see or store your bank credentials — authentication is handled entirely by Plaid.</li>
            <li>
              Your Plaid access token is encrypted with AES-256-GCM and stored only on your device.
              It is never sent to or stored on AutoCard&apos;s servers beyond the instant needed to
              fetch your transactions.
            </li>
            <li>Transaction data is stored locally on your device and used only to improve
              card recommendations.</li>
            <li>You can disconnect any account at any time from Settings.</li>
          </ul>
          <p className="mt-2">
            By connecting a financial account, you agree to{' '}
            <a
              href="https://plaid.com/legal/#end-user-privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              Plaid&apos;s End User Privacy Policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To recommend the best credit card for each purchase category.</li>
            <li>To show nearby businesses and surface contextual card tips.</li>
            <li>To track welcome bonus progress and annual fee ROI.</li>
            <li>To simulate hypothetical card performance on your real spend history.</li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> sell, rent, or share your data with third parties for
            marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Data Storage &amp; Security</h2>
          <p>
            All personal data is stored locally in your browser. We do not operate a user database.
            Financial tokens are encrypted before storage. Clearing your browser data or localStorage
            permanently removes all AutoCard data from your device.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Your Rights</h2>
          <p>
            Because we don&apos;t store your data on our servers, there is nothing for us to delete
            on our end. To remove all data, clear your browser&apos;s localStorage for{' '}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{appUrl}</span>.
            To disconnect a bank account, go to Settings → Connected Accounts and tap the trash icon.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Continued use of AutoCard after changes
            constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <p>
            Questions? Email us at{' '}
            <a href={`mailto:${contact}`} className="text-indigo-600 underline">{contact}</a>.
          </p>
        </section>

      </div>

      <BottomNav/>
    </div>
  );
}
