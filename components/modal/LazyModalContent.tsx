import React from "react";

/** Skip hidden picker/dialog trees until first use, then retain them for exit motion. */
export function LazyModalContent({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = React.useState(visible);
  if (visible && !opened) setOpened(true);
  return opened || visible ? <>{children}</> : null;
}
