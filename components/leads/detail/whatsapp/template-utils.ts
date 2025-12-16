export function safeStr(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

export function formatIDRNumber(n: any) {
  const num = typeof n === "string" ? Number(n) : n;
  if (!num || Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function renderWaTemplate(
  body: string,
  ctx: {
    lead?: any;
    user?: any;
    settings?: any;
  }
) {
  const lead = ctx.lead || {};
  const user = ctx.user || {};
  const settings = ctx.settings || {};

  const map: Record<string, string> = {
    "{lead_name}": safeStr(lead?.name),
    "{lead_phone}": safeStr(lead?.phone),
    "{product_name}": safeStr(lead?.product?.name),
    "{company_name}": safeStr(settings?.companyName || "Perusahaan Kami"),
    "{sales_name}": safeStr(user?.name),
    "{price_offering}": formatIDRNumber(lead?.priceOffering),
    "{price_negotiation}": formatIDRNumber(lead?.priceNegotiation),
    "{price_closing}": formatIDRNumber(lead?.priceClosing),
  };

  let out = body || "";
  for (const k of Object.keys(map)) {
    out = out.split(k).join(map[k]);
  }
  return out;
}
