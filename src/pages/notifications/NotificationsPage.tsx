import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">Notifications</div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Notifications module placeholder.</CardContent>
      </Card>
    </div>
  )
}


