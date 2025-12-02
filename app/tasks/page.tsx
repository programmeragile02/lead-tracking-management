import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TaskCard } from "@/components/tasks/task-card"

export default function TasksPage() {
  return (
    <DashboardLayout title="Tugas" role="sales">
      <div className="space-y-4">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium whitespace-nowrap">
            Semua
          </button>
          <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium whitespace-nowrap">
            Hari Ini
          </button>
          <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium whitespace-nowrap">
            Terlambat
          </button>
          <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium whitespace-nowrap">
            Mendatang
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <TaskCard
            leadName="Budi Permana"
            product="Paket Premium"
            followUpType="FU1"
            dueDate="Hari Ini"
            dueTime="09:30"
            status="overdue"
          />
          <TaskCard
            leadName="Sari Dewi"
            product="Paket Starter"
            followUpType="FU2"
            dueDate="Hari Ini"
            dueTime="15:00"
            status="pending"
          />
          <TaskCard
            leadName="PT Sentosa"
            product="Paket Bisnis"
            followUpType="FU1"
            dueDate="Besok"
            dueTime="10:00"
            status="upcoming"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
