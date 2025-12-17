import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export function UserLogPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">User Log</div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>User Log</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">User Log module placeholder.</CardContent>
      </Card>
    </div>
  )
}


