"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadOverviewTab } from "./tabs/lead-overview-tab"
import { LeadActivityTab } from "./tabs/lead-activity-tab"
import { LeadWhatsAppTab } from "./tabs/lead-whatsapp-tab"
import { LeadCustomFieldsTab } from "./tabs/lead-custom-fields-tab"

export function LeadDetailTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full grid grid-cols-4 h-auto">
        <TabsTrigger value="overview" className="text-xs sm:text-sm font-semibold">
          Ringkasan
        </TabsTrigger>
        <TabsTrigger value="activity" className="text-xs sm:text-sm font-semibold">
          Aktivitas
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="text-xs sm:text-sm font-semibold">
          WhatsApp
        </TabsTrigger>
        <TabsTrigger value="fields" className="text-xs sm:text-sm font-semibold">
          Data Tambahan
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="overview">
          <LeadOverviewTab />
        </TabsContent>
        <TabsContent value="activity">
          <LeadActivityTab />
        </TabsContent>
        <TabsContent value="whatsapp">
          <LeadWhatsAppTab />
        </TabsContent>
        <TabsContent value="fields">
          <LeadCustomFieldsTab />
        </TabsContent>
      </div>
    </Tabs>
  )
}
