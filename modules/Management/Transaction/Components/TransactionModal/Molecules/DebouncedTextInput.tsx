import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-paper";
import { useDebouncedCallback } from "use-debounce";

interface DebouncedTextInputProps extends Omit<
  React.ComponentProps<typeof TextInput>,
  "value" | "onChangeText" | "onBlur" | "ref"
> {
  initialValue: string;
  onBlur: (v: string) => void;
  onChangeText: (v: string) => void;
}

export const DebouncedTextInput = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  DebouncedTextInputProps
>(function DebouncedTextInput(
  { initialValue, onBlur, onChangeText, ...props },
  ref,
) {
  const [local, setLocal] = useState(initialValue);
  // Paper exposes an imperative handle, while RN's inherited ref prop expects
  // a native input. A callback safely forwards the common handle to our caller.
  const forwardInputRef = React.useCallback((input: React.ElementRef<typeof TextInput> | null) => {
    if (typeof ref === "function") ref(input);
    else if (ref) ref.current = input;
  }, [ref]);

  useEffect(() => {
    setLocal(initialValue);
  }, [initialValue]);

  const debounced = useDebouncedCallback((v: string) => onBlur(v), 300);

  return (
    <TextInput
      ref={forwardInputRef}
      {...props}
      value={local}
      onChangeText={(v) => {
        setLocal(v);
        onChangeText?.(v); // live passthrough if parent wants it
        debounced(v); // debounced commit
      }}
      onBlur={() => {
        debounced.cancel();
        onBlur(local); // always flush on actual blur
      }}
    />
  );
});
