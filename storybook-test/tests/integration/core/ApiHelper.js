const axios = require('axios');

class ApiHelper {
  constructor(baseUrl, token) {
    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}/v1/accounts/me/`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async listFolderContent(folderId, options = { }) {
    const { page = '', pageSize = 1000 } = options;
    return this.axiosInstance.get(
      `storage/folders/${folderId}/contents?page=${page}&page_size=${pageSize}`,
    );
  }
}

module.exports = ApiHelper;
