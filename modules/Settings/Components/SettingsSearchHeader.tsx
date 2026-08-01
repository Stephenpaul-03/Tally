import React from "react";
import { SettingsHeader } from "./SettingsHeader";

type SettingsSearchHeaderProps = {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (value: boolean) => void;
  onBack?: () => void;
  placeholder?: string;
  modal?: boolean;
  rightAccessoryBeforeSearch?: React.ReactNode;
};

export function SettingsSearchHeader({
  title,
  query,
  onQueryChange,
  searchOpen,
  onSearchOpenChange,
  onBack,
  placeholder,
  modal = false,
  rightAccessoryBeforeSearch,
}: SettingsSearchHeaderProps) {
  return (
    <SettingsHeader
      title={title}
      onBack={onBack}
      query={query}
      onQueryChange={onQueryChange}
      searchOpen={searchOpen}
      onSearchOpenChange={onSearchOpenChange}
      searchPlaceholder={placeholder ?? `Search ${title.toLowerCase()}`}
      modal={modal}
      rightAccessoryBeforeSearch={rightAccessoryBeforeSearch}
    />
  );
}
