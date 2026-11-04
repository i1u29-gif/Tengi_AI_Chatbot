/**
 * Tầng Kiểm Thử & Chặn Dữ Liệu Sai (Validation & Security Utility)
 * Đáp ứng Tiêu chí 2 (An toàn cơ bản) & Tiêu chí 4 (Kiểm tra, chặn dữ liệu sai, xử lý biên)
 */
window.TengiApp = window.TengiApp || {};

window.TengiApp.Validator = {
  MAX_CHAT_LENGTH: 500,
  MAX_NAME_LENGTH: 80,
  MAX_NOTE_LENGTH: 300,

  // Chống XSS cơ bản khi render ra DOM
  escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[m]);
  },

  // Kiểm tra tin nhắn đầu vào của người dùng
  validateChatMessage(rawText) {
    const text = String(rawText ?? "").trim();
    if (!text) {
      return { valid: false, error: "Vui lòng nhập nội dung câu hỏi (không được để trống hoặc chỉ chứa khoảng trắng)." };
    }
    if (text.length > this.MAX_CHAT_LENGTH) {
      return {
        valid: false,
        error: `Câu hỏi quá dài (${text.length}/${this.MAX_CHAT_LENGTH} ký tự). Vui lòng tóm tắt ngắn gọn hơn.`
      };
    }
    return { valid: true, sanitized: text };
  },

  // Kiểm tra dữ liệu Form đặt lịch (Họ tên, SĐT Việt Nam, Ngày/Giờ không ở quá khứ, Không trùng khung giờ)
  validateBookingForm({ name, phone, date, time, note }, existingBookings = []) {
    const cleanName = String(name ?? "").trim().replace(/\s+/g, " ");
    const cleanPhone = String(phone ?? "").trim().replace(/[\s.-]/g, "");
    const cleanDate = String(date ?? "").trim();
    const cleanTime = String(time ?? "").trim();
    const cleanNote = String(note ?? "").trim();

    if (!cleanName || cleanName.length < 2) {
      return { valid: false, field: "bookName", error: "Họ và tên phải có ít nhất 2 ký tự hợp lệ." };
    }
    if (cleanName.length > this.MAX_NAME_LENGTH) {
      return { valid: false, field: "bookName", error: `Họ và tên không vượt quá ${this.MAX_NAME_LENGTH} ký tự.` };
    }
    // Chặn tên chỉ toàn số hoặc ký tự đặc biệt
    if (!/[a-zA-ZÀ-ỹ]/.test(cleanName)) {
      return { valid: false, field: "bookName", error: "Họ và tên phải chứa chữ cái hợp lệ." };
    }

    // Kiểm tra SĐT chuẩn Việt Nam (10 số bắt đầu bằng 03, 05, 07, 08, 09)
    const vnPhoneRegex = /^(0[35789])[0-9]{8}$/;
    if (!vnPhoneRegex.test(cleanPhone)) {
      return {
        valid: false,
        field: "bookPhone",
        error: "Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số chuẩn Việt Nam (bắt đầu bằng 03, 05, 07, 08, 09)."
      };
    }

    if (!cleanDate || !cleanTime) {
      return { valid: false, field: "bookDate", error: "Vui lòng chọn đầy đủ ngày và giờ hẹn." };
    }

    // Kiểm tra thời gian hẹn không nằm trong quá khứ
    const selectedDateTime = new Date(`${cleanDate}T${cleanTime}:00`);
    const now = new Date();
    if (isNaN(selectedDateTime.getTime())) {
      return { valid: false, field: "bookDate", error: "Định dạng ngày hoặc giờ không hợp lệ." };
    }
    // Cho phép sai số 2 phút so với hiện tại
    if (selectedDateTime.getTime() < now.getTime() - 2 * 60 * 1000) {
      return {
        valid: false,
        field: "bookDate",
        error: "Không thể đặt lịch hẹn trong quá khứ! Vui lòng chọn ngày/giờ từ thời điểm hiện tại trở đi."
      };
    }

    // Kiểm tra giờ hành chính/mở cửa (08:00 - 20:00)
    const [hourStr, minStr] = cleanTime.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    if (hour < 8 || (hour === 20 && minute > 0) || hour > 20) {
      return {
        valid: false,
        field: "bookTime",
        error: "Khung giờ tư vấn hoạt động từ 08:00 đến 20:00 hàng ngày. Vui lòng chọn trong khung giờ này."
      };
    }

    // Kiểm tra trùng lịch hẹn (Cùng SĐT + Cùng Ngày + Cùng Giờ)
    const isDuplicate = existingBookings.some(
      (b) => b.phone === cleanPhone && b.date === cleanDate && b.time === cleanTime
    );
    if (isDuplicate) {
      return {
        valid: false,
        field: "bookTime",
        error: "Số điện thoại này đã có lịch hẹn vào đúng khung giờ trên. Vui lòng chọn khung giờ khác!"
      };
    }

    if (cleanNote.length > this.MAX_NOTE_LENGTH) {
      return {
        valid: false,
        field: "bookNote",
        error: `Ghi chú không được vượt quá ${this.MAX_NOTE_LENGTH} ký tự.`
      };
    }

    return {
      valid: true,
      sanitized: {
        name: cleanName,
        phone: cleanPhone,
        date: cleanDate,
        time: cleanTime,
        note: cleanNote || "Tư vấn chung"
      }
    };
  },

  // Kiểm tra và chuẩn hóa JSON trả về từ AI (Kiểm soát đầu ra AI - Tiêu chí 3)
  validateAndNormalizeAIOutput(rawJson, faqList) {
    if (!rawJson || typeof rawJson !== "object") {
      return null;
    }
    const answer = typeof rawJson.answer === "string" ? rawJson.answer.trim() : "";
    if (!answer) return null;

    const can_answer = Boolean(rawJson.can_answer);
    let suggested = Array.isArray(rawJson.suggested_questions)
      ? rawJson.suggested_questions.filter((q) => typeof q === "string" && q.trim().length > 0).map((q) => q.trim())
      : [];

    // Đảm bảo LUÔN có đúng 03 câu hỏi gợi ý theo đúng Yêu cầu 2
    for (const item of faqList) {
      if (suggested.length >= 3) break;
      if (!suggested.includes(item.question)) {
        suggested.push(item.question);
      }
    }
    suggested = suggested.slice(0, 3);

    return {
      answer,
      can_answer,
      suggested_questions: suggested
    };
  }
};
