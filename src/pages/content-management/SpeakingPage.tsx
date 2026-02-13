import { Link } from "react-router-dom"
import { Plus, Mic } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

export function SpeakingPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            Speaking
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-grayScale-400">
            Create and manage speaking practice sessions for your learners.
          </p>
        </div>
        <Link to="/content/speaking/add-practice" className="w-full sm:w-auto">
          <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New Practice
          </Button>
        </Link>
      </div>

      <Card className="border-2 border-dashed border-grayScale-200 shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200">
            <Mic className="h-10 w-10 text-brand-500" />
          </div>
          <h3 className="text-lg font-semibold text-grayScale-600">
            No speaking practices yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-grayScale-400">
            Get started by adding your first speaking practice session. Your
            learners will be able to practice pronunciation and conversation
            skills.
          </p>
          <Link to="/content/speaking/add-practice" className="mt-8">
            <Button className="bg-brand-500 px-6 hover:bg-brand-600">
              <Plus className="h-4 w-4" />
              Create Your First Practice
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
