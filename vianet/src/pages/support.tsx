export function Support() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Support</h2>
      <p className="text-muted-foreground mb-4">
        Need help? Contact our support team or browse the documentation below.
      </p>
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">FAQ</h3>
          <p className="text-sm text-muted-foreground">Find answers to common questions.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Contact Us</h3>
          <p className="text-sm text-muted-foreground">Reach out to our support team.</p>
        </div>
      </div>
    </div>
  );
}
