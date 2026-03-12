import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminSectionScaffold({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin {title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{title} management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Scaffold is ready. Connect this screen to dedicated CRUD actions and table views.</p>
          <div className="flex gap-2">
            <Button variant="secondary">Create</Button>
            <Button variant="secondary">Edit selected</Button>
            <Button variant="danger">Archive</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
