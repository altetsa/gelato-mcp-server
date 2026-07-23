#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const GELATO_API_KEY = process.env.GELATO_API_KEY;

function getHeaders() {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY environment variable is not set. Please set GELATO_API_KEY in your MCP configuration.');
  }
  return {
    'X-API-KEY': GELATO_API_KEY,
    'Content-Type': 'application/json',
  };
}

const server = new Server(
  {
    name: 'gelato-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool specifications
const TOOLS = [
  {
    name: 'gelato_list_stores',
    description: 'List all stores connected to your Gelato account. Returns store IDs needed for product creation and management.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gelato_get_template',
    description: 'Get details for a specific Gelato product template by its templateId (copied from Gelato Dashboard), including variant IDs and image placeholder names (e.g. ImageFront, ImageBack).',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Gelato Template ID from Dashboard' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'gelato_create_product_from_template',
    description: 'Create a new product in a Gelato store based on a template with customized design files, title, description, tags, and variants.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'Gelato Store ID' },
        templateId: { type: 'string', description: 'Gelato Product Template ID' },
        title: { type: 'string', description: 'Title of the product' },
        description: { type: 'string', description: 'Description of the product (supports HTML)' },
        isVisibleInTheOnlineStore: { type: 'boolean', description: 'Whether the product is visible in online store (default: true)' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags associated with the product',
        },
        salesChannels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Sales channels (e.g., ["web"])',
        },
        variants: {
          type: 'array',
          description: 'Array of variant configurations. Each variant can specify templateVariantId and imagePlaceholders.',
          items: {
            type: 'object',
            properties: {
              templateVariantId: { type: 'string' },
              imagePlaceholders: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Placeholder layer name in template (e.g. ImageFront, ImageBack)' },
                    fileUrl: { type: 'string', description: 'Public URL of the design image (PNG, JPG, PDF)' },
                  },
                  required: ['name', 'fileUrl'],
                },
              },
            },
            required: ['templateVariantId'],
          },
        },
      },
      required: ['storeId', 'templateId'],
    },
  },
  {
    name: 'gelato_list_products',
    description: 'List products in a specific Gelato store.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'Gelato Store ID' },
        limit: { type: 'number', description: 'Number of items to return' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
      required: ['storeId'],
    },
  },
  {
    name: 'gelato_get_product',
    description: 'Get product details and publication status by store ID and product ID.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'Gelato Store ID' },
        productId: { type: 'string', description: 'Gelato Product ID' },
      },
      required: ['storeId', 'productId'],
    },
  },
  {
    name: 'gelato_delete_product',
    description: 'Delete a product from a Gelato store.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'Gelato Store ID' },
        productId: { type: 'string', description: 'Gelato Product ID' },
      },
      required: ['storeId', 'productId'],
    },
  },
  {
    name: 'gelato_list_catalogs',
    description: 'List main product catalogs available in Gelato (apparel, wall art, mugs, cards, etc.).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gelato_search_catalog_products',
    description: 'Search catalog products by catalog ID or attribute filters.',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string', description: 'Catalog ID (e.g. apparel, wall-art)' },
        attributeFilters: { type: 'object', description: 'Attribute filter key-value pairs' },
      },
      required: ['catalogId'],
    },
  },
  {
    name: 'gelato_get_catalog_product',
    description: 'Get detailed product specs (dimensions, print areas, variants, options, prices) for a catalog product UID.',
    inputSchema: {
      type: 'object',
      properties: {
        productUid: { type: 'string', description: 'Gelato Catalog Product UID (e.g., apparel_canvas_gildan-5000_black_l)' },
      },
      required: ['productUid'],
    },
  },
  {
    name: 'gelato_create_order',
    description: 'Create and submit a print fulfillment order in Gelato.',
    inputSchema: {
      type: 'object',
      properties: {
        orderType: { type: 'string', description: 'Order type: "draft" or "order" (default: draft)' },
        orderReferenceId: { type: 'string', description: 'Your internal reference ID for this order' },
        customerReferenceId: { type: 'string', description: 'Your internal reference ID for the customer' },
        currency: { type: 'string', description: 'Currency code (USD, EUR, GBP, etc.)' },
        items: {
          type: 'array',
          description: 'Items in the order',
          items: {
            type: 'object',
            properties: {
              itemReferenceId: { type: 'string' },
              productUid: { type: 'string' },
              quantity: { type: 'number' },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: 'File type (e.g. "default", "back")' },
                    url: { type: 'string', description: 'URL of the design file' },
                  },
                  required: ['url'],
                },
              },
            },
            required: ['itemReferenceId', 'productUid', 'quantity', 'files'],
          },
        },
        shippingAddress: {
          type: 'object',
          description: 'Recipient shipping address',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            addressLine1: { type: 'string' },
            addressLine2: { type: 'string' },
            city: { type: 'string' },
            postCode: { type: 'string' },
            country: { type: 'string', description: 'ISO 2-letter country code (e.g., US, DE, FR)' },
            email: { type: 'string' },
            phone: { type: 'string' },
          },
          required: ['firstName', 'lastName', 'addressLine1', 'city', 'postCode', 'country', 'email'],
        },
      },
      required: ['orderReferenceId', 'customerReferenceId', 'currency', 'items', 'shippingAddress'],
    },
  },
  {
    name: 'gelato_quote_order',
    description: 'Calculate shipping choices and cost quote for an order before placing it.',
    inputSchema: {
      type: 'object',
      properties: {
        orderReferenceId: { type: 'string' },
        customerReferenceId: { type: 'string' },
        currency: { type: 'string' },
        items: { type: 'array' },
        shippingAddress: { type: 'object' },
      },
      required: ['orderReferenceId', 'customerReferenceId', 'currency', 'items', 'shippingAddress'],
    },
  },
  {
    name: 'gelato_get_order',
    description: 'Get details and current status of a Gelato order.',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Gelato Order ID' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'gelato_search_orders',
    description: 'Search for orders in your Gelato account.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        offset: { type: 'number' },
        search: { type: 'string' },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const headers = getHeaders();

  try {
    let responseData;

    switch (name) {
      case 'gelato_list_stores': {
        const res = await axios.get('https://ecommerce.gelatoapis.com/v1/stores', { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_get_template': {
        const { templateId } = args;
        const res = await axios.get(`https://ecommerce.gelatoapis.com/v1/templates/${templateId}`, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_create_product_from_template': {
        const { storeId, templateId, title, description, isVisibleInTheOnlineStore = true, tags, salesChannels, variants } = args;
        const body = {
          templateId,
          title,
          description,
          isVisibleInTheOnlineStore,
          tags,
          salesChannels,
          variants,
        };
        // Remove undefined keys
        Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);

        const res = await axios.post(
          `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products:create-from-template`,
          body,
          { headers }
        );
        responseData = res.data;
        break;
      }

      case 'gelato_list_products': {
        const { storeId, limit, offset } = args;
        const res = await axios.get(`https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products`, {
          headers,
          params: { limit, offset },
        });
        responseData = res.data;
        break;
      }

      case 'gelato_get_product': {
        const { storeId, productId } = args;
        const res = await axios.get(`https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products/${productId}`, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_delete_product': {
        const { storeId, productId } = args;
        const res = await axios.delete(`https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products/${productId}`, { headers });
        responseData = res.data || { success: true, message: `Product ${productId} deleted successfully.` };
        break;
      }

      case 'gelato_list_catalogs': {
        const res = await axios.get('https://product.gelatoapis.com/v3/catalogs', { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_search_catalog_products': {
        const { catalogId, attributeFilters } = args;
        const res = await axios.post(
          `https://product.gelatoapis.com/v3/catalogs/${catalogId}/products:search`,
          { attributeFilters: attributeFilters || {} },
          { headers }
        );
        responseData = res.data;
        break;
      }

      case 'gelato_get_catalog_product': {
        const { productUid } = args;
        const res = await axios.get(`https://product.gelatoapis.com/v3/products/${productUid}`, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_create_order': {
        const { orderType = 'draft', orderReferenceId, customerReferenceId, currency, items, shippingAddress } = args;
        const body = {
          orderType,
          orderReferenceId,
          customerReferenceId,
          currency,
          items,
          shippingAddress,
        };
        const res = await axios.post('https://order.gelatoapis.com/v4/orders', body, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_quote_order': {
        const { orderReferenceId, customerReferenceId, currency, items, shippingAddress } = args;
        const body = {
          orderReferenceId,
          customerReferenceId,
          currency,
          items,
          shippingAddress,
        };
        const res = await axios.post('https://order.gelatoapis.com/v4/orders:quote', body, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_get_order': {
        const { orderId } = args;
        const res = await axios.get(`https://order.gelatoapis.com/v4/orders/${orderId}`, { headers });
        responseData = res.data;
        break;
      }

      case 'gelato_search_orders': {
        const { limit, offset, search } = args;
        const res = await axios.post(
          'https://order.gelatoapis.com/v4/orders:search',
          { limit, offset, search },
          { headers }
        );
        responseData = res.data;
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Gelato API Error: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails}`,
        },
      ],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error('Fatal error starting Gelato MCP server:', err);
  process.exit(1);
});
