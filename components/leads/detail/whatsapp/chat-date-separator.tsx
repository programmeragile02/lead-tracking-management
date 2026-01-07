export function ChatDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center my-3">
      <div className="rounded-full bg-[#1F2C33] px-3 py-1 text-[11px] text-[#8696A0] shadow-sm">
        {new Date(date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}