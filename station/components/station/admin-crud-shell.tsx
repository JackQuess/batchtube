import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminCrudShellProps {
  title: string;
  description: string;
  form: React.ReactNode;
  table: React.ReactNode;
}

export function AdminCrudShell({ title, description, form, table }: AdminCrudShellProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin {title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create or Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{description}</p>
          {form}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing Records</CardTitle>
        </CardHeader>
        <CardContent>{table}</CardContent>
      </Card>
    </div>
  );
}
