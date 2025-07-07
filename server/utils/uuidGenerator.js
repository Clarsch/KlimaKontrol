const crypto = require('crypto');

/**
 * Generate a unique UUID for data records
 * @returns {string} A unique UUID
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Generate a UUID and add it to a data record
 * @param {Object} record - The data record to add UUID to
 * @returns {Object} The record with UUID added
 */
function addUUIDToRecord(record) {
    return {
        id: generateUUID(),
        ...record
    };
}

module.exports = {
    generateUUID,
    addUUIDToRecord
}; 