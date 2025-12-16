"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  Sparkles,
  Smile,
  SendHorizonal,
  FileText,
  MessageSquareText,
  MoreVertical,
  BookmarkPlus,
} from "lucide-react";
import { MessageStatusIcon } from "../message-status-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WhatsAppChatCard(props: {
  displayName: string;
  displayPhone: string;
  leadHasPhone: boolean;

  syncingChat: boolean;
  onSyncChat: () => void;

  messagesLoading: boolean;
  chatMessages: any[];
  chatWrapRef: React.RefObject<HTMLDivElement>;

  chatInput: string;
  setChatInput: (v: string) => void;
  sending: boolean;
  onSend: () => void;

  onOpenProposal: () => void;
  onOpenFollowUp: () => void;

  onOpenQuickMessage: () => void;

  // simpan dari bubble sales
  onSaveMessageToTemplate?: (m: any) => void;

  EMOJIS: string[];
  insertAtCursor: (e: string) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const {
    displayName,
    displayPhone,
    leadHasPhone,
    syncingChat,
    onSyncChat,
    messagesLoading,
    chatMessages,
    chatWrapRef,
    chatInput,
    setChatInput,
    sending,
    onSend,
    onOpenProposal,
    onOpenFollowUp,
    onOpenQuickMessage,
    onSaveMessageToTemplate,
    EMOJIS,
    insertAtCursor,
    chatInputRef,
  } = props;

  // ✅ Controlled dropdown per message id
  const [menuOpenById, setMenuOpenById] = useState<Record<string, boolean>>({});

  function setMenuOpen(id: string | number, open: boolean) {
    setMenuOpenById((prev) => ({ ...prev, [String(id)]: open }));
  }

  return (
    <Card className="overflow-hidden py-0 gap-0 border-[#202C33] bg-[#111B21]">
      {/* Header sticky */}
      <CardHeader className="sticky top-0 z-10 border-b border-[#202C33] bg-[#202C33] p-3">
        <div className="flex items-center justify-between gap-3 mt-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#005C4B] flex items-center justify-center text-white font-bold">
              WA
            </div>
            <div className="space-y-0.5">
              <p className="text-sm md:text-base font-semibold text-[#E9EDEF]">
                Chat dengan {displayName}
              </p>
              <p className="text-xs md:text-sm text-[#8696A0]">
                {displayPhone !== "-" ? displayPhone : "Nomor WA belum diisi"}
              </p>
            </div>
          </div>

          {/* Right */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
            onClick={onSyncChat}
            disabled={syncingChat || !leadHasPhone}
            title={
              !leadHasPhone
                ? "Lead belum punya nomor WA"
                : "Ambil histori chat dari WhatsApp"
            }
          >
            {syncingChat ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {syncingChat ? "Sync..." : "Sync Chat"}
          </Button>
        </div>
      </CardHeader>

      {/* Body chat */}
      <CardContent className="p-0">
        <div
          className="h-[420px] sm:h-[520px]"
          style={{
            backgroundColor: "#0B141A",
            backgroundImage:
              `url("data:image/svg+xml,` +
              encodeURIComponent(`
                <svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
                  <g fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='1.5'>
                    <path d='M28 44c16-10 28-10 44 0' />
                    <path d='M168 44c16-10 28-10 44 0' />
                    <path d='M40 132c18-12 30-12 48 0' />
                    <path d='M150 140c18-12 30-12 48 0' />
                    <circle cx='70' cy='86' r='9' />
                    <circle cx='184' cy='94' r='9' />
                    <path d='M112 76l14 14-14 14-14-14z' />
                    <path d='M120 170c10-8 22-8 32 0' />
                    <path d='M20 200c14-10 26-10 40 0' />
                  </g>
                </svg>
              `) +
              `")`,
            backgroundRepeat: "repeat",
          }}
        >
          <div
            ref={chatWrapRef}
            className="flex h-full flex-col gap-2 overflow-y-auto px-3 py-3"
          >
            {messagesLoading && (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8696A0]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat percakapan...
              </div>
            )}

            {!messagesLoading && chatMessages.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8696A0]">
                Belum ada percakapan WhatsApp.
              </div>
            )}

            {chatMessages.map((m) => {
              const isSales = m.from === "sales";

              return (
                <div
                  key={m.id}
                  className={`flex ${
                    isSales ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={[
                      "relative max-w-[85%] px-3 py-2 shadow-sm",
                      "text-sm leading-relaxed",

                      // bubble color
                      isSales
                        ? "bg-[#005C4B] text-[#E9EDEF] rounded-2xl rounded-br-sm"
                        : "bg-[#202C33] text-[#E9EDEF] rounded-2xl rounded-bl-sm",

                      // tail
                      isSales
                        ? "after:content-[''] after:absolute after:-right-1 after:bottom-2 after:border-y-[7px] after:border-y-transparent after:border-l-[9px] after:border-l-[#005C4B]"
                        : "after:content-[''] after:absolute after:-left-1 after:bottom-2 after:border-y-[7px] after:border-y-transparent after:border-r-[9px] after:border-r-[#202C33]",
                    ].join(" ")}
                  >
                    {m.type === "MEDIA" && m.mediaUrl ? (
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[
                          "mb-2 flex items-center gap-2 rounded-lg border px-2 py-2",
                          isSales
                            ? "border-white/15 bg-white/10 text-[#E9EDEF]"
                            : "border-[#2A3942] bg-[#111B21] text-[#E9EDEF]",
                        ].join(" ")}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black/10">
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {m.mediaName || "Lampiran"}
                          </p>
                          <p className="text-xs text-[#8696A0]">
                            Klik untuk buka
                          </p>
                        </div>
                      </a>
                    ) : null}

                    {m.text ? (
                      <p className="whitespace-pre-line">{m.text}</p>
                    ) : null}

                    {/* ✅ Aksi bubble untuk pesan dari sales */}
                    {isSales ? (
                      <div className="absolute -top-2 -right-2">
                        <DropdownMenu
                          open={!!menuOpenById[String(m.id)]}
                          onOpenChange={(v) => setMenuOpen(m.id, v)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full border border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33] flex items-center justify-center cursor-pointer"
                              title="Aksi pesan"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setMenuOpen(m.id, false);
                                onSaveMessageToTemplate?.(m);
                              }}
                            >
                              <BookmarkPlus className="mr-2 h-4 w-4" />
                              Simpan ke Template Saya
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : null}

                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#8696A0]">
                      <span>{m.time}</span>
                      {isSales ? (
                        <MessageStatusIcon
                          status={m.waStatus}
                          className={
                            m.waStatus === "READ"
                              ? "text-[#53BDEB]"
                              : "text-[#8696A0]"
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Composer sticky */}
      <div className="sticky bottom-0 border-t border-[#202C33] bg-[#202C33]">
        <div className="p-3 space-y-2">
          {/* Row 1 */}
          <div className="flex items-end gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 text-[#8696A0] hover:bg-[#1F2C33]"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="rounded-md p-1 text-lg hover:bg-muted"
                      onClick={() => insertAtCursor(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Textarea
              ref={chatInputRef}
              rows={1}
              className="min-h-[44px] resize-none bg-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] border-none focus:ring-0 text-sm rounded-2xl"
              placeholder="Ketik pesan"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending && chatInput.trim()) void onSend();
                }
              }}
            />

            <Button
              type="button"
              size="icon"
              className="h-11 w-11 rounded-full bg-[#005C4B] hover:bg-[#006D5B]"
              onClick={onSend}
              disabled={!chatInput.trim() || sending}
              title="Kirim"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <SendHorizonal className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
              onClick={onOpenProposal}
            >
              <FileText className="mr-2 h-4 w-4" />
              Kirim Penawaran
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
              onClick={onOpenFollowUp}
            >
              Follow up
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
              onClick={onOpenQuickMessage}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              Pesan Cepat
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
