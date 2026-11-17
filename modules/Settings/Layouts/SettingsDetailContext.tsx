import React from "react";

/** A settings page hosted inside the tablet detail pane. */
export const SettingsDetailContext = React.createContext(false);
/** Final detail width, shared before descendants receive their layout callbacks. */
export const SettingsDetailWidthContext = React.createContext<number | null>(null);
/** Only the outer settings modal becomes inline; its child dialogs stay modal. */
export const InlineSettingsModalContext = React.createContext(false);
