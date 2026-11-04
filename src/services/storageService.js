/**
 * Tầng Lưu Trữ Dữ Liệu (Storage Service): Quản lý localStorage an toàn
 * Có cơ chế tự phục hồi (Self-healing) khi dữ liệu localStorage bị hỏng (Corrupted JSON)
 */
window.TengiApp = window.TengiApp || {};

window.TengiApp.StorageService = {
  STORAGE_KEY: "tengi_appointments_v1",
  SESSION_KEY_API: "tengi_gemini_api_key_session",

  getBookings() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("Dữ liệu lịch hẹn không phải mảng hợp lệ.");
      }
      // Lọc các bản ghi hợp lệ
      return parsed.filter(
        (item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.phone === "string"
      );
    } catch (err) {
      console.warn("[StorageService] Phát hiện dữ liệu localStorage bị lỗi, tự động khôi phục mảng rỗng:", err);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  },

  saveBookings(bookings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookings));
      return { success: true };
    } catch (err) {
      console.error("[StorageService] Lỗi ghi localStorage:", err);
      return { success: false, error: "Bộ nhớ trình duyệt (localStorage) đã đầy hoặc bị chặn." };
    }
  },

  addBooking(bookingData) {
    const list = this.getBookings();
    const newRecord = {
      id: "LH-" + Math.floor(100000 + Math.random() * 900000),
      ...bookingData,
      createdAt: new Date().toLocaleString("vi-VN")
    };
    list.unshift(newRecord);
    const saveResult = this.saveBookings(list);
    return { ...saveResult, record: newRecord, total: list.length };
  },

  deleteBookingById(id) {
    const list = this.getBookings();
    const filtered = list.filter((item) => item.id !== id);
    this.saveBookings(filtered);
    return filtered;
  },

  clearAll() {
    this.saveBookings([]);
    return [];
  },

  // Lưu API Key tạm thời trong sessionStorage (không lưu cứng trong code)
  getApiKey() {
    return sessionStorage.getItem(this.SESSION_KEY_API) || "";
  },

  setApiKey(key) {
    if (!key) {
      sessionStorage.removeItem(this.SESSION_KEY_API);
    } else {
      sessionStorage.setItem(this.SESSION_KEY_API, key.trim());
    }
  }
};
