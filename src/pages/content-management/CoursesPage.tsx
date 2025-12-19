import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

export function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grayScale-900">Courses</h1>
        <Link to="/content/courses/add-video">
          <Button className="bg-brand-500 hover:bg-brand-600">
            <Plus className="h-4 w-4" />
            Add New Video
          </Button>
        </Link>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Manage your course videos and content here.
        </CardContent>
      </Card>
    </div>
  )
}


