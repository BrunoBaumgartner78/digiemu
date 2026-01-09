/* eslint-disable */
// AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.
// Source: config/branding.yml
// Run: npm run gen:branding

export const brandingConfig = {
  "product": {
    "name": "DigiEmu",
    "positioning": {
      "canonical": {
        "en": "Digital Content & Asset Operating System",
        "de": "Betriebssystem für digitale Inhalte & Assets"
      },
      "short": {
        "en": "Content OS",
        "de": "Content OS"
      },
      "description": {
        "en": "A governed system for managing, distributing and monetizing digital content and assets with roles, approvals and payouts.\n",
        "de": "Ein kontrolliertes System zur Verwaltung, Freigabe und Monetarisierung digitaler Inhalte und Assets mit Rollen, Freigabeprozessen und Auszahlungen.\n"
      }
    }
  },
  "ui": {
    "navigation": {
      "marketplace": {
        "label": {
          "en": "Content OS",
          "de": "Content OS"
        },
        "long_label": {
          "en": "Digital Content & Asset OS",
          "de": "Digital Content & Asset OS"
        }
      }
    },
    "pages": {
      "marketplace": {
        "title": {
          "en": "Digital Content & Asset Operating System",
          "de": "Betriebssystem für digitale Inhalte & Assets"
        },
        "subtitle": {
          "en": "Manage, approve and monetize digital assets",
          "de": "Digitale Inhalte verwalten, freigeben und monetarisieren"
        }
      }
    }
  },
  "seo": {
    "default": {
      "title": {
        "en": "DigiEmu – Digital Content & Asset Operating System",
        "de": "DigiEmu – Betriebssystem für digitale Inhalte & Assets"
      },
      "description": {
        "en": "DigiEmu is a Digital Content & Asset Operating System for creators, publishers and communities.",
        "de": "DigiEmu ist ein Digital Content & Asset Operating System für Creator, Publisher und Communities."
      }
    }
  },
  "terminology": {
    "legacy": {
      "marketplace": {
        "deprecated": true,
        "replace_with": "Digital Content & Asset Operating System"
      }
    }
  }
} as const;
export type BrandingConfig = typeof brandingConfig;
