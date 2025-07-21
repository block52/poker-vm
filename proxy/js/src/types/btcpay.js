/**
 * @fileoverview Simple BTCPay webhook type definitions - only what we actually use
 */

/**
 * BTCPay webhook event (we only care about settlement events)
 * @typedef {'InvoiceSettled' | 'InvoiceProcessing'} BTCPayEventType
 */

/**
 * BTCPay webhook payload - only the fields we actually use
 * @typedef {Object} BTCPayWebhook
 * @property {BTCPayEventType} type - Event type
 * @property {string} invoiceId - Invoice ID
 * @property {number|string} amount - BTC amount
 * @property {number|string} [price] - Alternative BTC amount field
 * @property {Object} metadata - Invoice metadata
 * @property {string} metadata.b52address - Block52 address (0x...)
 */

/**
 * Success response when webhook processes payment
 * @typedef {Object} WebhookSuccess
 * @property {boolean} success - Always true
 * @property {string} message - Success message
 * @property {string|number} btcAmount - Original BTC amount
 * @property {string} usdcAmount - Converted USDC amount
 * @property {number} conversionRate - BTC to USDC rate
 * @property {string} txHash - Ethereum transaction hash
 */

/**
 * Error response when webhook fails
 * @typedef {Object} WebhookError
 * @property {boolean} success - Always false
 * @property {string} error - Error message
 * @property {string} [details] - Additional error details
 */

/**
 * Deposit contract call result
 * @typedef {Object} ContractResult
 * @property {boolean} success - Whether call succeeded
 * @property {string} [hash] - Transaction hash if successful
 * @property {string} [error] - Error message if failed
 */

module.exports = {}; 