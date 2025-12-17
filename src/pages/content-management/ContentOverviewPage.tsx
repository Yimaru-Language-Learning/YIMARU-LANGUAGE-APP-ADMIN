import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export function ContentOverviewPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Manage courses content (scaffold).</CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Speaking</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Manage speaking content (scaffold).</CardContent>
      </Card>
    </div>
  )
}


