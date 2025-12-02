"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadListCard } from "@/components/leads/lead-list-card"

export function ProblemLeadsTabs() {
  return (
    <Tabs defaultValue="overdue" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="overdue">Overdue</TabsTrigger>
        <TabsTrigger value="hot">Hot Not Closed</TabsTrigger>
        <TabsTrigger value="untouched">Untouched</TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <TabsContent value="overdue" className="space-y-3">
          <LeadListCard
            leadName="Budi Permana"
            status="hot"
            product="Premium Package"
            channel="IG Ads"
            createdDate="5 days ago"
            nextFollowUp="2 days ago"
            followUpType="FU2"
            indicator="overdue"
          />
        </TabsContent>
        <TabsContent value="hot" className="space-y-3">
          <LeadListCard
            leadName="Sari Dewi"
            status="hot"
            product="Starter Package"
            channel="Referral"
            createdDate="7 days ago"
            nextFollowUp="Today"
            followUpType="FU3"
            indicator="due-today"
          />
        </TabsContent>
        <TabsContent value="untouched" className="space-y-3">
          <LeadListCard
            leadName="PT Sentosa"
            status="new"
            product="Business Plan"
            channel="Website"
            createdDate="3 days ago"
            indicator="normal"
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
