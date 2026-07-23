# Gelato API & Shopify Automation MCP Server

[![Model Context Protocol](https://img.shields.io/badge/MCP-Server-blue.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)

A Model Context Protocol (MCP) server for integrating with the **Gelato Print-on-Demand API**. This server enables AI agents (such as Antigravity, Claude, ChatGPT, etc.) to automate product creation from custom design URLs/files, inspect product templates, manage Shopify store connections, explore catalog specifications, and process print fulfillment orders.

---

## ✨ Key Features

- 🎨 **Template-Based Product Creation**: Programmatically upload design files (PNG, JPG, PDF) to Gelato product template placeholders (`ImageFront`, `ImageBack`, etc.) and publish custom print-on-demand items directly to your connected e-commerce stores (Shopify, WooCommerce, etc.).
- 🏪 **Multi-Store Management**: Inspect connected stores (`gelato_list_stores`), view store products (`gelato_list_products`), inspect product status (`gelato_get_product`), and delete products (`gelato_delete_product`).
- 📐 **Template Inspection**: List templates (`gelato_list_templates`) and inspect layer structures and variant IDs (`gelato_get_template`).
- 📚 **Catalog Exploration**: Search Gelato's global product catalog (`gelato_search_catalog_products`), list categories (`gelato_list_catalogs`), and fetch product specifications (`gelato_get_catalog_product`).
- 📦 **Order Fulfillment & Quotes**: Request shipping/print price quotes (`gelato_quote_order`), place print orders (`gelato_create_order`), track order status (`gelato_get_order`), and search orders (`gelato_search_orders`).

---

## 🛠️ Available MCP Tools

### 1. Store & Product Management
- `gelato_list_stores` — List all connected stores and their `storeId`s.
- `gelato_create_product_from_template` — Create and publish a new product to a store from a Gelato template with custom design URLs, titles, descriptions, tags, and variants.
- `gelato_list_products` — List all products published in a specific store.
- `gelato_get_product` — Retrieve detailed information and publication status (`publishing`, `active`, `publishing_error`) for a product.
- `gelato_delete_product` — Remove a product from a store.

### 2. Gelato Templates
- `gelato_list_templates` — List all product templates created in your Gelato account.
- `gelato_get_template` — Retrieve details for a specific template, including image layer placeholder names (`ImageFront`, `ImageBack`) and `templateVariantId`s.

### 3. Product Catalog
- `gelato_list_catalogs` — List main product catalog categories (Apparel, Wall Art, Mugs, Cards, etc.).
- `gelato_search_catalog_products` — Search catalog items using attribute filters.
- `gelato_get_catalog_product` — Get specs, printable areas, available dimensions, options, and prices for a catalog product UID.

### 4. Orders & Quotes
- `gelato_create_order` — Submit a print fulfillment order to Gelato.
- `gelato_quote_order` — Calculate shipping options and cost quotes before placing an order.
- `gelato_get_order` — Retrieve current order status and tracking details.
- `gelato_search_orders` — Search orders with pagination and text search.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18.x or higher
- Gelato API Key (obtainable from [Gelato Dashboard](https://dashboard.gelato.com/) → **Developer > API Keys**)

### Installation

```bash
git clone https://github.com/altetsa/gelato-mcp-server.git
cd gelato-mcp-server
npm install
```

### Configuration

Add the server entry to your MCP configuration file (e.g., `mcp_config.json` or Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gelato": {
      "command": "node",
      "args": [
        "/path/to/gelato-mcp-server/index.js"
      ],
      "env": {
        "GELATO_API_KEY": "your_gelato_api_key_here"
      }
    }
  }
}
```

---

## 🚀 Product Creation Workflow

1. **Get Store ID**: Call `gelato_list_stores` to get your target store's `storeId`.
2. **Inspect Template**: Call `gelato_get_template` with your `templateId` to check layer placeholder names (e.g. `ImageFront`) and `templateVariantId`s.
3. **Create Product**: Call `gelato_create_product_from_template` with:
   - `storeId`
   - `templateId`
   - `title` & `description`
   - `variants`: Array of objects containing `templateVariantId` and `imagePlaceholders` with `name` and public `fileUrl` of your print design.

#### Example Tool Call Payload:

```json
{
  "storeId": "82ceff8e-c559-45da-9c93-3982702a0906",
  "templateId": "c12a363e-0d4e-4d96-be4b-bf4138eb8743",
  "title": "Custom Printed T-Shirt",
  "description": "<p>High quality custom printed unisex crewneck t-shirt.</p>",
  "isVisibleInTheOnlineStore": true,
  "tags": ["t-shirt", "custom-print", "unisex"],
  "salesChannels": ["web"],
  "variants": [
    {
      "templateVariantId": "83e30e31-0aee-4eca-8a8f-dceb2455cdc1",
      "imagePlaceholders": [
        {
          "name": "ImageFront",
          "fileUrl": "https://example.com/designs/front_artwork.png"
        }
      ]
    }
  ]
}
```

---

## 📄 License

MIT © [altetsa](https://github.com/altetsa)
