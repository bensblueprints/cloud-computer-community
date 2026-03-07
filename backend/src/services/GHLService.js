const axios = require("axios");

class GHLService {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.baseUrl = "https://services.leadconnectorhq.com";
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    });
  }

  /**
   * Create a new sub-account (location) for a CloudCode customer
   * @param {Object} params - Sub-account details
   * @param {string} params.name - Business name
   * @param {string} params.email - Business email
   * @param {string} params.phone - Phone number (optional)
   * @param {string} params.address - Street address (optional)
   * @param {string} params.city - City (optional)
   * @param {string} params.state - State (optional)
   * @param {string} params.country - Country code (default: US)
   * @param {string} params.postalCode - Postal code (optional)
   * @param {string} params.timezone - Timezone (default: America/New_York)
   * @returns {Object} Created sub-account details
   */
  async createSubAccount(params) {
    try {
      const payload = {
        name: params.name,
        email: params.email,
        phone: params.phone || "",
        address: params.address || "",
        city: params.city || "",
        state: params.state || "",
        country: params.country || "US",
        postalCode: params.postalCode || "",
        timezone: params.timezone || "America/New_York",
        // Settings for CloudCode customers
        settings: {
          allowDuplicateContact: false,
          allowDuplicateOpportunity: false,
          allowFacebookNameMerge: false
        }
      };

      console.log(`[GHL] Creating sub-account for: ${params.email}`);

      const response = await this.client.post("/locations/", payload);

      console.log(`[GHL] Sub-account created: ${response.data.location?.id || response.data.id}`);

      return {
        success: true,
        locationId: response.data.location?.id || response.data.id,
        data: response.data
      };
    } catch (error) {
      console.error("[GHL] Failed to create sub-account:", error.response?.data || error.message);

      // Don't fail the whole provisioning if GHL fails
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get sub-account details
   * @param {string} locationId - The sub-account/location ID
   */
  async getSubAccount(locationId) {
    try {
      const response = await this.client.get(`/locations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error("[GHL] Failed to get sub-account:", error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Create a user in a sub-account
   * @param {string} locationId - The sub-account ID
   * @param {Object} user - User details (firstName, lastName, email, role)
   */
  async createUser(locationId, user) {
    try {
      const payload = {
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        type: "account",
        role: user.role || "user",
        locationIds: [locationId],
        permissions: {
          dashboardStats: true,
          contacts: {
            enabled: true,
            create: true,
            update: true,
            delete: true,
            bulkAction: true
          },
          opportunities: {
            enabled: true,
            create: true,
            update: true,
            delete: true
          },
          conversations: {
            enabled: true
          },
          calendars: {
            enabled: true
          }
        }
      };

      const response = await this.client.post("/users/", payload);

      console.log(`[GHL] User created in location ${locationId}: ${user.email}`);

      return {
        success: true,
        userId: response.data.id,
        data: response.data
      };
    } catch (error) {
      console.error("[GHL] Failed to create user:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete a sub-account
   * @param {string} locationId - The sub-account ID to delete
   */
  async deleteSubAccount(locationId) {
    try {
      await this.client.delete(`/locations/${locationId}`);
      console.log(`[GHL] Sub-account deleted: ${locationId}`);
      return { success: true };
    } catch (error) {
      console.error("[GHL] Failed to delete sub-account:", error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if GHL integration is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new GHLService();
