import { InfoLayout } from "./legal/InfoLayout"

export function PrivacyPage() {
  return (
    <InfoLayout
      title="Privacy Policy"
      subtitle="This policy explains how Yimaru Academy handles personal, educational, and operational data across learning and administration workflows."
    >
      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Data We Process</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          We process account information, course activity, assessment records, and administrative logs
          to support platform functionality, progress reporting, and security monitoring.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">How Data Is Used</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-grayScale-600">
          <li>Deliver and personalize course experiences.</li>
          <li>Track learner progress and learning outcomes.</li>
          <li>Manage permissions, operational controls, and audit trails.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Security and Retention</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Access controls, role-based restrictions, and logging are used to protect data integrity.
          Data is retained according to organizational and legal requirements.
        </p>
      </section>
    </InfoLayout>
  )
}
