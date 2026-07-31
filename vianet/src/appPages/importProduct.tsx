import { useState } from "react"
import { FileSpreadsheet, Upload, Send, FileJson } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ImportProduct() {
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [jsonText, setJsonText] = useState("")
  const [matchKey, setMatchKey] = useState("sku")
  const [excelLoading, setExcelLoading] = useState(false)
  const [jsonLoading, setJsonLoading] = useState(false)

  async function handleExcelMatch() {
    if (!excelFile) {
      toast.error("Please choose an Excel file first.")
      return
    }
    setExcelLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", excelFile)
      formData.append("matchKey", matchKey)
      const res = await fetch("/api/app/import/product/excel", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      toast.success("Products matched from Excel.", {
        description: `${data.matched ?? 0} matched, ${data.unmatched ?? 0} unmatched.`,
      })
    } catch {
      toast.error("Could not match products. Please try again.")
    } finally {
      setExcelLoading(false)
    }
  }

  async function handleSendJson() {
    if (!jsonText.trim()) {
      toast.error("Please paste the product JSON.")
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      toast.error("Invalid JSON. Please check the format.")
      return
    }
    setJsonLoading(true)
    try {
      const res = await fetch("/api/app/import/product/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      toast.success("Product JSON sent.", {
        description: `${data.imported ?? 0} imported.`,
      })
    } catch {
      toast.error("Could not send product JSON. Please try again.")
    } finally {
      setJsonLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import Product</h2>
        <p className="text-sm text-muted-foreground">
          Import products by matching an Excel sheet or by sending a product JSON payload.
        </p>
      </div>

      <Tabs defaultValue="excel" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="excel">
            <FileSpreadsheet className="size-4" />
            Match by Excel
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileJson className="size-4" />
            Send JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle>Match by Excel</CardTitle>
              <CardDescription>
                Upload an Excel file of products and match them against existing records.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="excel-file">Excel file</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
                />
                {excelFile && (
                  <span className="text-xs text-muted-foreground">{excelFile.name}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="match-key">Match by column</Label>
                <Input
                  id="match-key"
                  value={matchKey}
                  onChange={(e) => setMatchKey(e.target.value)}
                  placeholder="sku"
                />
              </div>
              <Button onClick={handleExcelMatch} disabled={excelLoading} className="w-fit gap-2">
                <Upload className="size-4" />
                {excelLoading ? "Matching..." : "Match Products"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>Send JSON</CardTitle>
              <CardDescription>
                Paste the product JSON payload and send it to import products.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="json-text">Product JSON</Label>
                <Textarea
                  id="json-text"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='[{"sku":"ABC-1","name":"Product 1","price":100}]'
                  className="min-h-48 font-mono text-xs"
                />
              </div>
              <Button onClick={handleSendJson} disabled={jsonLoading} className="w-fit gap-2">
                <Send className="size-4" />
                {jsonLoading ? "Sending..." : "Send JSON"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
