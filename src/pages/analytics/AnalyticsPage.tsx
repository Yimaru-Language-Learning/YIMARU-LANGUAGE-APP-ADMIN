import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">Analytics</div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Analytics module placeholder.</CardContent>
      </Card>
    </div>
  )
}


