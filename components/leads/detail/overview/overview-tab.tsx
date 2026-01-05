"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Pencil, X } from "lucide-react";

import type { DynamicField } from "./types-optional";
import { OverviewHeaderActions } from "./overview-header-actions";
import { OverviewContactSection } from "./overview-contact-section";
import { OverviewProductSection } from "./overview-product-section";
import { OverviewPriceSection } from "./overview-price-section";
import { OverviewDynamicFieldsSection } from "./overview-dynamic-fields-section";
import { Card, CardContent } from "@/components/ui/card";

type OverviewPriceKind = "OFFERING" | "NEGOTIATION" | "CLOSING";

export function OverviewTab(props: {
  // state & flags
  overviewEditing: boolean;
  setOverviewEditing: (v: boolean) => void;
  savingOverview: boolean;
  detailLoading: boolean;

  // actions
  onCancel: () => void;
  onSave: () => void;

  // data display (non-edit)
  displayName: string;
  displayPhone: string;
  displaySource: string;
  displayAddress: string;
  displayCity: string;
  displayProductName: string;

  // lead + products
  lead: any;
  products: { id: number; name: string }[];
  updatingProduct: boolean;

  // editable fields
  overviewName: string;
  setOverviewName: (v: string) => void;
  overviewPhone: string;
  setOverviewPhone: (v: string) => void;
  overviewAddress: string;
  setOverviewAddress: (v: string) => void;
  overviewCity: string;
  setOverviewCity: (v: string) => void;

  overviewProductId: string;
  setOverviewProductId: (v: string) => void;

  // price formatter
  formatCurrencyIDR: (value?: number | string | null) => string;

  // dynamic fields
  dynamicFields: any[]; // kalau mau rapih: DynamicField[]
  overviewCustomValues: Record<number, string>;
  setCustomValue: (fieldId: number, value: string) => void;
  isSales: boolean;

  overviewPrices: Record<OverviewPriceKind, { value: string; date: string }>;
  setOverviewPrices: React.Dispatch<
    React.SetStateAction<
      Record<OverviewPriceKind, { value: string; date: string }>
    >
  >;

  statuses: {
    id: number;
    name: string;
    subStatuses?: {
      id: number;
      name: string;
    }[];
  }[];

  overviewStatusId: number | null;
  setOverviewStatusId: (v: number | null) => void;

  overviewSubStatusId: number | null;
  setOverviewSubStatusId: (v: number | null) => void;
}) {
  const {
    overviewEditing,
    setOverviewEditing,
    savingOverview,
    detailLoading,
    onCancel,
    onSave,

    displayName,
    displayPhone,
    displaySource,
    displayAddress,
    displayCity,
    displayProductName,

    lead,
    products,
    updatingProduct,

    overviewName,
    setOverviewName,
    overviewPhone,
    setOverviewPhone,
    overviewAddress,
    setOverviewAddress,
    overviewCity,
    setOverviewCity,
    overviewProductId,
    setOverviewProductId,

    formatCurrencyIDR,

    dynamicFields,
    overviewCustomValues,
    setCustomValue,
    isSales,

    overviewPrices,
    setOverviewPrices,

    statuses,

    overviewStatusId,
    overviewSubStatusId,
    setOverviewStatusId,
    setOverviewSubStatusId,
  } = props;

  return (
    <Card className="bg-secondary">
      <CardContent>
        <div className="space-y-4 text-sm">
          <div className="mb-2 flex items-center justify-end">
            <OverviewHeaderActions
              overviewEditing={overviewEditing}
              setOverviewEditing={setOverviewEditing}
              detailLoading={detailLoading}
              savingOverview={savingOverview}
              onCancel={onCancel}
              onSave={onSave}
              isSales={isSales}
            />
          </div>

          <OverviewContactSection
            overviewEditing={overviewEditing}
            displayName={displayName}
            displayPhone={displayPhone}
            displaySource={displaySource}
            displayAddress={displayAddress}
            displayCity={displayCity}
            overviewName={overviewName}
            setOverviewName={setOverviewName}
            overviewPhone={overviewPhone}
            setOverviewPhone={setOverviewPhone}
            overviewAddress={overviewAddress}
            setOverviewAddress={setOverviewAddress}
            overviewCity={overviewCity}
            setOverviewCity={setOverviewCity}
          />

          <OverviewProductSection
            overviewEditing={overviewEditing}
            lead={lead}
            displayProductName={displayProductName}
            products={products}
            updatingProduct={updatingProduct}
            detailLoading={detailLoading}
            overviewProductId={overviewProductId}
            setOverviewProductId={setOverviewProductId}
            statuses={statuses}
            overviewStatusId={overviewStatusId}
            setOverviewStatusId={setOverviewStatusId}
            overviewSubStatusId={overviewSubStatusId}
            setOverviewSubStatusId={setOverviewSubStatusId}
          />

          <OverviewPriceSection
            lead={lead}
            overviewEditing={overviewEditing}
            overviewPrices={overviewPrices}
            setOverviewPrices={setOverviewPrices}
            formatCurrencyIDR={formatCurrencyIDR}
          />

          <OverviewDynamicFieldsSection
            overviewEditing={overviewEditing}
            dynamicFields={dynamicFields}
            overviewCustomValues={overviewCustomValues}
            setCustomValue={setCustomValue}
          />
        </div>
      </CardContent>
    </Card>
  );
}
