export function Email() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Email Marketing</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage email campaigns and customer communications.
      </p>
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Campaigns</h3>
          <p className="text-sm text-muted-foreground">View and manage email campaigns.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Subscriber List</h3>
          <p className="text-sm text-muted-foreground">Manage subscriber lists and groups.</p>
        </div>
      </div>
    </div>
  );
}