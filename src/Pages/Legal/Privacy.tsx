import type { ReactNode } from "react";
import { useSettings } from "../../context/SettingsContext";

const UPDATED = "August 21, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-[20px] font-bold ink sm:text-[22px]">{title}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed muted2">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const { settings } = useSettings();
  const siteName = settings.site_name || "Hybrid Learning";
  const email = settings.support_email || "hello@digitallearning.com";

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full bg-cyan-200/20 blur-[80px]" />
        <div className="relative mx-auto max-w-[900px] px-4 text-center sm:px-6">
          <p className="mb-2 text-sm font-semibold text-blue-100">Legal</p>
          <h1 className="font-display text-[32px] font-extrabold text-white sm:text-[44px]">Privacy Policy</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100">Last updated: {UPDATED}</p>
        </div>
      </div>

      <div className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-e1 dark:border-slate-700 dark:bg-slate-800 sm:px-10">
          <p className="text-[14.5px] leading-relaxed muted2">
            This Privacy Policy explains what information {siteName} collects, how we use it, and the choices you
            have. It applies to anyone who visits our website or creates an account, whether as a student or an
            instructor.
          </p>

          <Section title="1. Information We Collect">
            <p><strong className="ink font-semibold">Account information:</strong> name, email address, password (stored securely, never in plain text), and profile details you add such as an avatar or bio.</p>
            <p><strong className="ink font-semibold">Third-party sign-in:</strong> if you sign in with Google or GitHub, we receive basic profile details (name, email, avatar) from that provider to create or link your account.</p>
            <p><strong className="ink font-semibold">Course activity:</strong> courses you enroll in, lessons you complete, quiz results, watch progress, and reviews you submit.</p>
            <p><strong className="ink font-semibold">Payment information:</strong> when you make a purchase, payment is handled by our payment processor. We store the outcome of a transaction (amount, order, receipt/invoice) but not your full card or bank credentials.</p>
            <p><strong className="ink font-semibold">Instructor application data:</strong> if you apply to teach, we collect qualification details, identity verification documents, and payout account information needed to review your application and pay you.</p>
            <p><strong className="ink font-semibold">Device & usage data:</strong> IP address, browser type, and general usage patterns, collected automatically to keep the Platform secure and working correctly.</p>
            <p><strong className="ink font-semibold">Cookies & local storage:</strong> we use your browser's local storage to keep you signed in, remember preferences (such as dark mode, language, or which dashboard view you last used), and similar small pieces of data needed for the site to function.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To create and maintain your account, and let you access courses you've purchased.</li>
              <li>To process payments, payouts, invoices, and receipts.</li>
              <li>To send account-related notifications (e.g. course updates, order confirmations, verification codes).</li>
              <li>To review instructor applications and course submissions.</li>
              <li>To detect fraud, abuse, and violations of our Terms of Service.</li>
              <li>To improve the Platform based on aggregated, non-identifying usage trends.</li>
            </ul>
          </Section>

          <Section title="3. Who We Share Data With">
            <p>
              We do not sell your personal information. We share data only where necessary to operate the Platform:
              payment processors (to complete transactions), infrastructure and hosting providers, email delivery
              providers (to send verification codes and notifications), and, if you choose to sign in with Google or
              GitHub, those providers as part of the authentication process. We may also disclose information if
              required by law.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              We keep your account and course data for as long as your account is active, and afterward as needed to
              comply with legal, tax, or accounting obligations (for example, order and payout records). You may
              request deletion of your account at any time — see Section 6.
            </p>
          </Section>

          <Section title="5. Data Security">
            <p>
              We use industry-standard measures — including password hashing and encrypted connections — to protect
              your information. No method of transmission or storage is 100% secure, so we cannot guarantee absolute
              security, but we work to protect your data and respond quickly to any suspected breach.
            </p>
          </Section>

          <Section title="6. Your Rights & Choices">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Access or update your profile information at any time from your account settings.</li>
              <li>Request a copy of the personal data we hold about you.</li>
              <li>Request deletion of your account and associated personal data, subject to records we must legally retain.</li>
              <li>Opt out of non-essential email notifications from your notification preferences.</li>
            </ul>
            <p>To exercise any of these rights, contact us at {email}.</p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              {siteName} is not directed at children under 13, and we do not knowingly collect personal information
              from children under 13. If you believe a child has provided us with personal information, contact us
              and we will remove it.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will update the
              "Last updated" date above. Continuing to use the Platform after changes take effect means you accept
              the updated policy.
            </p>
          </Section>

          <Section title="9. Contact Us">
            <p>
              Questions about this Privacy Policy or how we handle your data can be sent to{" "}
              <a href={`mailto:${email}`} className="text-blue-600 underline dark:text-blue-400">{email}</a>.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
