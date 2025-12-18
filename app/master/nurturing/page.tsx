"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryPanel } from "@/components/master/nurturing/category-panel";
import { PlanPanel } from "@/components/master/nurturing/plan-panel";
import { TemplatePanel } from "@/components/master/nurturing/template-panel";
import { TopicPanel } from "@/components/master/nurturing/topic-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MasterNurturingPage() {
  return (
    <DashboardLayout title="Master Nurturing">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Master Nurturing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola konten nurturing mulai dari Kategori → Topik/Judul → Template
            A/B → Urutan
          </p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full h-20 md:h-fit grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="topics">Topik / Judul</TabsTrigger>
            <TabsTrigger value="templates">Template A/B</TabsTrigger>
            <TabsTrigger value="plans">Urutan Nurturing</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="pt-4">
            <CategoryPanel />
          </TabsContent>

          <TabsContent value="topics" className="pt-4">
            <TopicPanel />
          </TabsContent>

          <TabsContent value="templates" className="pt-4">
            <TemplatePanel />
          </TabsContent>

          <TabsContent value="plans" className="pt-4">
            <PlanPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
