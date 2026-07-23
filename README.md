# Gelato API MCP Server

Готовый Model Context Protocol (MCP) сервер для интеграции и автоматизации работы с API Gelato.

## 🚀 Что позволяет этот MCP сервер?

Сервер предоставляет набор инструментов (tools) для автоматизации создания продуктов, работы с магазинами, каталогом, шаблонами и заказами Gelato.

### 📋 Список доступных инструментов:

1. **Создание и управление продуктами**:
   - `gelato_create_product_from_template` — создание продукта в магазине по шаблону Gelato (с передачей ссылок на принты/дизайны для слоев `ImageFront`, `ImageBack` и т.д.).
   - `gelato_list_products` — получение списка всех продуктов магазина.
   - `gelato_get_product` — получение подробной информации и статуса публикации продукта.
   - `gelato_delete_product` — удаление продукта из магазина.

2. **Работа с магазинами и шаблонами (Templates)**:
   - `gelato_list_stores` — получение списка подключенных магазинов и их `storeId`.
   - `gelato_list_templates` — получение списка доступных шаблонов продуктов.
   - `gelato_get_template` — получение структуры шаблона (слои заполнителей изображений, доступные варианты `templateVariantId`).

3. **Каталог товаров Gelato**:
   - `gelato_list_catalogs` — просмотр категорий каталога Gelato (одежда, холсты, кружки, открытки и т.д.).
   - `gelato_search_catalog_products` — поиск товаров в каталоге.
   - `gelato_get_catalog_product` — получение детальных характеристик товара (`productUid`), включая размеры, печатные области и цены.

4. **Заказы и Расчет Стоимости (Orders & Quotes)**:
   - `gelato_create_order` — создание и отправка заказа на печать/доставку.
   - `gelato_quote_order` — предварительный расчёт стоимости заказа и доставки.
   - `gelato_get_order` — проверка статуса заказа.
   - `gelato_search_orders` — поиск заказов.

---

## ⚙️ Настройка и Подключение

### 1. Получение API ключа Gelato
1. Войдите в ваш кабинет [Gelato Dashboard](https://dashboard.gelato.com/).
2. Перейдите в раздел **Developer > API Keys**.
3. Создайте новый API ключ (`X-API-KEY`).

### 2. Конфигурация в `mcp_config.json`
В вашем файле конфигурации MCP ([mcp_config.json](file:///root/mcp_config.json)) сервер уже зарегистрирован:

```json
{
  "mcpServers": {
    "gelato": {
      "command": "node",
      "args": [
        "/root/gelato-mcp-server/index.js"
      ],
      "env": {
        "GELATO_API_KEY": "ВАШ_GELATO_API_KEY"
      }
    }
  }
}
```
Замените `"YOUR_GELATO_API_KEY_HERE"` на ваш реальный ключ API Gelato.

---

## 🎨 Пошаговый процесс автоматизации создания продуктов (Product Creation Workflow)

1. **Получить Store ID**: Вызовите `gelato_list_stores` для получения `storeId`.
2. **Выбрать Шаблон**: Вызовите `gelato_list_templates` и `gelato_get_template` с нужным `templateId`. Из ответа вы увидите наименования слоёв (например, `ImageFront`) и ID вариантов (`templateVariantId`).
3. **Запустить создание продукта**: Вызовите `gelato_create_product_from_template`, передав:
   - `storeId`
   - `templateId`
   - `title` и `description`
   - `variants`: массив объектов с `templateVariantId` и ссылками на изображение `fileUrl` (прямая URL ссылка на PNG/JPG/PDF принт).

Пример вызова `gelato_create_product_from_template`:
```json
{
  "storeId": "your-store-id",
  "templateId": "your-template-id",
  "title": "Футболка с авторским принтом",
  "description": "<p>Качественная футболка с уникальным дизайном</p>",
  "isVisibleInTheOnlineStore": true,
  "variants": [
    {
      "templateVariantId": "variant-id-1",
      "imagePlaceholders": [
        {
          "name": "ImageFront",
          "fileUrl": "https://example.com/designs/front_print.png"
        }
      ]
    }
  ]
}
```
