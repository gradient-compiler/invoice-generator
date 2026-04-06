import path from "path";
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "EB Garamond",
  fonts: [
    {
      src: path.join(process.cwd(), "src/pdf/fonts/EBGaramond-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "src/pdf/fonts/EBGaramond-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
