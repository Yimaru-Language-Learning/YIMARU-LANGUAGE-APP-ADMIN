import { Link } from "react-router-dom"
import { BookOpen, Mic, Briefcase, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

export function ContentOverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-grayScale-900">Content Management</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Courses</CardTitle>
            <CardDescription>Manage course videos and educational content</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/content/courses">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">Manage Courses</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <Mic className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Speaking</CardTitle>
            <CardDescription>Manage speaking practice sessions and exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/content/speaking">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">Manage Speaking</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Practice</CardTitle>
            <CardDescription>Manage practice details, members, and leadership</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/content/practices">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">Manage Practice</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Questions</CardTitle>
            <CardDescription>Manage questions, quizzes, and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/content/questions">
              <Button className="w-full bg-brand-500 hover:bg-brand-600">Manage Questions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


