import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">{title}</div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This section is scaffolded in the sidebar/routes. We can fill it in next.
        </CardContent>
      </Card>
    </div>
  )
}


