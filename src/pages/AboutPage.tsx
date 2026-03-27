import { InfoLayout } from "./legal/InfoLayout"

export function AboutPage() {
  return (
    <InfoLayout
      title="About"
      subtitle="Yimaru Academy provides modern, structured learning experiences and the administration tools to manage courses, question sets, speaking practices, and learner progress at scale."
    >
      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">What is Yimaru Academy?</h2>
        <p className="text-sm leading-relaxed text-grayScale-600">
          Yimaru Academy is a digital learning platform focused on high-quality content delivery,
          measurable learner outcomes, and efficient administration for training teams.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[#ece4f7] bg-gradient-to-br from-white to-[#fcf8ff] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-grayScale-700">Core Platform Capabilities</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-grayScale-600">
          <li>Manage course categories, sub-categories, courses, videos, and assessments.</li>
          <li>Create practice question sets including multiple choice, short answer, and audio types.</li>
          <li>Track learner progress and completion metrics across course structures.</li>
          <li>Operate teams, roles, notifications, and user lifecycle from one dashboard.</li>
        </ul>
      </section>
    </InfoLayout>
  )
}
