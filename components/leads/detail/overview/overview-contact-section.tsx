"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OverviewInfoItem } from "./overview-info-item";
import { Inbox, MapPin, Phone, User } from "lucide-react";
import { CitySearchSelect } from "./city-search-select";
import { Badge } from "@/components/ui/badge";

export function OverviewContactSection(props: {
  overviewEditing: boolean;

  displayName: string;
  displayPhone: string;
  displaySource: string;
  displayAddress: string;
  displayCity: string;

  overviewName: string;
  setOverviewName: (v: string) => void;
  overviewPhone: string;
  setOverviewPhone: (v: string) => void;
  overviewAddress: string;
  setOverviewAddress: (v: string) => void;
  overviewCity: string;
  setOverviewCity: (v: string) => void;
  overviewCityId: number | null;
  setOverviewCityId: (v: number | null) => void;
  overviewProvinceName: string | null;
  setOverviewProvinceName: (v: string | null) => void;
  selectedCity: any | null;
  setSelectedCity: (v: any | null) => void;
}) {
  const {
    overviewEditing,

    displayName,
    displayPhone,
    displaySource,
    displayAddress,
    displayCity,

    overviewName,
    setOverviewName,
    overviewPhone,
    setOverviewPhone,
    overviewAddress,
    setOverviewAddress,
    overviewCity,
    setOverviewCity,
    overviewCityId,
    setOverviewCityId,
    overviewProvinceName,
    setOverviewProvinceName,
    selectedCity,
    setSelectedCity,
  } = props;

  return (
    <div>
      <p className="mb-2 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Kontak
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <OverviewInfoItem icon={User} label="Nama Lengkap">
          {overviewEditing ? (
            <Input
              className="h-9 text-xs sm:text-sm"
              value={overviewName}
              onChange={(e) => setOverviewName(e.target.value)}
            />
          ) : (
            displayName
          )}
        </OverviewInfoItem>

        <OverviewInfoItem icon={Phone} label="WhatsApp">
          {overviewEditing ? (
            <Input
              className="h-9 text-xs sm:text-sm"
              value={overviewPhone}
              onChange={(e) => setOverviewPhone(e.target.value)}
            />
          ) : (
            displayPhone
          )}
        </OverviewInfoItem>

        <OverviewInfoItem icon={Inbox} label="Sumber Lead">
          {displaySource}
        </OverviewInfoItem>

        <OverviewInfoItem icon={MapPin} label="Alamat">
          {overviewEditing ? (
            <Textarea
              rows={2}
              className="text-xs sm:text-sm w-56"
              value={overviewAddress}
              onChange={(e) => setOverviewAddress(e.target.value)}
            />
          ) : (
            displayAddress
          )}
        </OverviewInfoItem>

        <OverviewInfoItem icon={MapPin} label="Kota / Kabupaten">
          {overviewEditing ? (
            <div className="space-y-2">
              <CitySearchSelect
                value={selectedCity}
                onSelect={(city) => {
                  setSelectedCity(city);
                  setOverviewCityId(city.id); // id utama
                  setOverviewCity(city.name); // legacy
                  setOverviewProvinceName(city.province.name);
                }}
              />

              {overviewProvinceName && (
                <Badge variant="secondary">
                  Provinsi: {overviewProvinceName}
                </Badge>
              )}
            </div>
          ) : (
            displayCity
          )}
        </OverviewInfoItem>
      </div>
    </div>
  );
}
