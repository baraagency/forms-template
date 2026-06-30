"use client";

import { Box, type SxProps, type Theme } from "@mui/material";

/** Replace `public/form-banner.svg` (or point `src` at your own asset). */
export const FORM_BANNER_SRC = "/form-banner.svg";
export const FORM_BANNER_ALT = "Company banner";

type FormBannerProps = {
  imageSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

export function FormBanner({ imageSx, sx }: FormBannerProps = {}) {
  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: { xs: 3, sm: 4 },
        ...sx,
      }}
    >
      <Box
        component="img"
        src={FORM_BANNER_SRC}
        alt={FORM_BANNER_ALT}
        sx={{
          display: "block",
          height: "auto",
          maxWidth: { xs: 260, sm: 360 },
          mx: "auto",
          width: "100%",
          ...imageSx,
        }}
      />
    </Box>
  );
}
