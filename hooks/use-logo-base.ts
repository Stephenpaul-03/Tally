import { Asset } from "expo-asset";
import { useEffect, useState } from "react";

export function useLogoBase64() {
  const [logoBase64, setLogoBase64] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const asset = Asset.fromModule(
        require("@/assets/images/icon-foreground-Gold.png"),
      );
      await asset.downloadAsync();

      const response = await fetch(asset.localUri!);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });
      setLogoBase64(base64);
    })();
  }, []);

  return logoBase64;
}
