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

export default function Terms() {
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
          <h1 className="font-display text-[32px] font-extrabold text-white sm:text-[44px]">Terms of Service</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100">Last updated: {UPDATED}</p>
        </div>
      </div>

      <div className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-e1 dark:border-slate-700 dark:bg-slate-800 sm:px-10">
          <p className="text-[14.5px] leading-relaxed muted2">
            These Terms of Service ("Terms") govern your access to and use of {siteName} (the "Platform"), including our
            website, courses, and related services. By creating an account, enrolling in a course, or applying to teach
            on {siteName}, you agree to these Terms. If you do not agree, please do not use the Platform.
          </p>

          <Section title="1. Accounts">
            <p>
              You must provide accurate information when creating an account, whether by email/password or by signing
              in through a third-party provider such as Google or GitHub. You are responsible for keeping your
              password secure and for all activity that happens under your account. Notify us immediately if you
              suspect unauthorized access.
            </p>
            <p>You must be at least 13 years old to create an account. Users under 18 should have a parent or guardian's permission.</p>
          </Section>

          <Section title="2. Courses, Enrollment & Access">
            <p>
              When you purchase or enroll in a course, we grant you a personal, non-transferable license to access
              that course's content for learning purposes. Some courses have a limited access period, shown on the
              course page; access is not guaranteed to be permanent unless stated otherwise.
            </p>
            <p>
              Free courses and course previews may be viewed without payment, but full access to paid course content
              requires a completed purchase. Sharing your account or course access with others is not permitted.
            </p>
          </Section>

          <Section title="3. Payments, Pricing & Refunds">
            <p>
              Prices are shown in the currency displayed at checkout and may include applicable taxes. Payments are
              processed through our supported payment methods; we do not store your full payment card or banking
              credentials.
            </p>
            <p>
              Refund eligibility (if any) is described at the time of purchase or in our support documentation.
              Refund requests should be sent to {email}. We reserve the right to decline a refund where there is
              evidence of abuse, such as having completed most of a course before requesting one.
            </p>
          </Section>

          <Section title="4. Instructor Program">
            <p>
              Instructors may apply to publish courses on the Platform. Approval is at our discretion and may require
              identity and qualification verification. Instructors retain ownership of the content they create, but by
              publishing a course, you grant {siteName} a worldwide, royalty-free license to host, stream, promote,
              and make that content available to enrolled students for as long as the course remains published.
            </p>
            <p>
              Instructors are responsible for ensuring their content does not infringe on any third party's rights and
              agree to receive payouts under the commission/revenue-share terms shown in their instructor dashboard.
              We may remove or reject content that violates these Terms or applicable law.
            </p>
          </Section>

          <Section title="5. Reviews & User Content">
            <p>
              Course reviews and any other content you submit (comments, messages, uploaded files) must be honest,
              relevant, and free of harassment, hate speech, or spam. We may moderate, hide, or remove reviews and
              other user content that violates these Terms, and pending reviews may be subject to approval before
              becoming publicly visible.
            </p>
          </Section>

          <Section title="6. Prohibited Conduct">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Sharing, reselling, or redistributing course content without authorization.</li>
              <li>Uploading content you do not have the rights to (pirated material, plagiarism).</li>
              <li>Attempting to bypass access controls, video protections, or payment requirements.</li>
              <li>Harassing, impersonating, or misleading other users, instructors, or staff.</li>
              <li>Using the Platform for any unlawful purpose or to distribute malware.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The {siteName} name, logo, design, and platform software are owned by us or our licensors and may not be
              copied or used without permission. Course content remains the property of the instructor who created it,
              subject to the license described in Section 4.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or
              misuse the Platform. You may stop using the Platform and request account deletion at any time; see our{" "}
              <a href="/privacy" className="text-blue-600 underline dark:text-blue-400">Privacy Policy</a> for details
              on how your data is handled after deletion.
            </p>
          </Section>

          <Section title="9. Disclaimers & Limitation of Liability">
            <p>
              The Platform and its content are provided "as is" without warranties of any kind. We do not guarantee
              that any course will meet your expectations or lead to a particular outcome (such as a job or
              certification). To the maximum extent permitted by law, {siteName} is not liable for indirect,
              incidental, or consequential damages arising from your use of the Platform.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms from time to time. If we make material changes, we will update the "Last
              updated" date above and, where appropriate, notify you. Continuing to use the Platform after changes
              take effect means you accept the updated Terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these Terms can be sent to{" "}
              <a href={`mailto:${email}`} className="text-blue-600 underline dark:text-blue-400">{email}</a>.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
