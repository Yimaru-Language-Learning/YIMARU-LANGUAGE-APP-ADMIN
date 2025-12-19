import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

export function SpeakingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grayScale-900">Speaking</h1>
        <Link to="/content/speaking/add-practice">
          <Button className="bg-brand-500 hover:bg-brand-600">
            <Plus className="h-4 w-4" />
            Add New Practice
          </Button>
        </Link>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Speaking Practice Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Manage speaking practice sessions and exercises here.
        </CardContent>
      </Card>
    </div>
  )
}


