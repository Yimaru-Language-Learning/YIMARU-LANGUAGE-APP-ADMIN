import { InfoLayout } from "./legal/InfoLayout"

export function AccountDeletionPage() {
  return (
    <InfoLayout
      title="Account Deletion"
      subtitle="Guidance on requesting and processing account deletion within Yimaru Academy."
    >
      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Before Deletion</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Confirm account ownership and review the potential impact on course history, progress
          reporting, team assignments, and related records.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Deletion Steps</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-grayScale-600">
          <li>
            Launch the <strong>Yimaru mobile app</strong> and <strong>sign in</strong> to the account you want to remove.
          </li>
          <li>
            Open your <strong>Profile</strong> area from the main menu or bottom navigation bar.
          </li>
          <li>
            Go into <strong>Account Settings</strong> (or <strong>Account Management</strong>, depending on your app version).
          </li>
          <li>
            Tap the option labeled <strong>Delete Account</strong> or <strong>Request Account Deletion</strong>.
          </li>
          <li>
            Review the warning details and complete the <strong>confirmation prompts</strong> shown on screen.
          </li>
          <li>
            Finish the process by verifying identity through your <strong>PIN</strong> or <strong>biometric authentication</strong> if requested.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Post-Deletion Notes</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Some records may be retained where required for compliance, security, or legal obligations.
          Deleted accounts typically cannot be restored.
        </p>
      </section>
    </InfoLayout>
  )
}
