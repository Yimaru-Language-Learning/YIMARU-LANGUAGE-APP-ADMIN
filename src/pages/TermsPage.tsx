import { InfoLayout } from "./legal/InfoLayout"

export function TermsPage() {
  return (
    <InfoLayout
      title="Terms and Conditions"
      subtitle="These terms define acceptable use of Yimaru Academy services, administration interfaces, and related learning operations."
    >
      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">1. Acceptable Use</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          The platform may only be used for legitimate education and administration workflows. Users
          must not misuse access, attempt unauthorized data access, or disrupt service availability.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">2. Account Responsibility</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Account owners are responsible for protecting credentials and all actions performed through
          their account. Shared accounts are discouraged unless explicitly authorized by policy.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">3. Service and Policy Updates</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Yimaru Academy may update features, controls, and policies to improve reliability and
          security. Continued platform use indicates acceptance of updated terms.
        </p>
      </section>
    </InfoLayout>
  )
}
