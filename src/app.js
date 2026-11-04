/**
 * Tầng Điều Phối Giao Diện & Nghiệp Vụ (Application Controller - v6 Kano Edition)
 * Tích hợp đầy đủ 4 nhóm tiêu chí BTC:
 * 1. PHẢI CHẠY (Must-be): Trả lời 10 FAQ, AI gợi ý 3 câu liên quan, Đề xuất & đặt lịch, Trang quản trị xem/xóa lịch.
 * 2. LÀM MƯỢT (Performance): Gợi ý câu hỏi nhanh (Quick replies: Giờ mở cửa, Báo giá, Đặt lịch), Hiệu ứng bot đang gõ 3 chấm động, Tự điền ngày giờ hôm nay.
 * 3. ĐIỂM WOW (Attractive): Thẻ "Đã xác nhận lịch!", Gửi xác nhận qua Zalo, Link thêm trực tiếp vào Google Calendar + tải file .ics, Âm thanh báo tin nhắn (Web Audio API).
 * 4. NÉ NGAY (Reverse): Chặn hoàn toàn trả lời tự do/lạc đề, kiểm soát chặt chẽ kịch bản.
 */
window.TengiApp = window.TengiApp || {};

(function () {
  const FAQ_DATA = window.TengiApp.FAQ_DATA;
  const Validator = window.TengiApp.Validator;
  const Storage = window.TengiApp.StorageService;
  const AIService = window.TengiApp.AIService;
  const Wow = window.TengiApp.WowHelper;

  let lastUnansweredQuestion = "";
  let latestBookingMap = {};

  window.addEventListener("DOMContentLoaded", () => {
    initSmartDateTimeDefaults();
    initApiKeyStatus();
    renderFaqList();
    renderAdminBookings();

    // Lời chào mở đầu theo kịch bản chuẩn + 03 câu hỏi gợi ý
    appendBotMessage(
      "Xin chào! 👋 Mình là **Trợ lý AI 24/7 của Tengi SmartHome**. Mình hoạt động theo kịch bản chuẩn giúp bạn tra cứu tức thì **10 câu hỏi thường gặp** (Giờ mở cửa, Báo giá, Bảo hành, Thi công...) hoặc hỗ trợ **Đặt lịch hẹn tư vấn** kèm xác nhận qua **Zalo & Google Calendar**. Bạn cần mình hỗ trợ thông tin nào ạ?",
      true,
      "SYSTEM_INIT"
    );
    renderSuggestedQuestions([FAQ_DATA[0].question, FAQ_DATA[1].question, FAQ_DATA[2].question]);
  });

  // Tự điền ngày giờ hôm nay thông minh (Kano Làm Mượt)
  function initSmartDateTimeDefaults() {
    const smart = Wow.getSmartDefaultDateTime();
    const dateInput = document.getElementById("bookDate");
    const timeInput = document.getElementById("bookTime");
    if (dateInput) {
      dateInput.min = smart.minDate;
      dateInput.value = smart.defaultDate;
    }
    if (timeInput) {
      timeInput.value = smart.defaultTime;
    }
  }

  window.fillTodayNow = function () {
    initSmartDateTimeDefaults();
    showToast("🕒 Đã tự động điền Ngày hôm nay & Khung giờ gần nhất!");
  };

  // Bật / Tắt âm thanh báo tin nhắn (Kano Điểm WOW)
  window.toggleSoundNotification = function () {
    Wow.soundEnabled = !Wow.soundEnabled;
    const btn = document.getElementById("btnSoundToggle");
    if (btn) {
      btn.innerHTML = Wow.soundEnabled ? "🔔 Âm báo: BẬT" : "🔕 Âm báo: TẮT";
      btn.className = Wow.soundEnabled
        ? "px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition"
        : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 transition";
    }
    if (Wow.soundEnabled) {
      Wow.playNotificationSound("bot");
    }
  };

  function initApiKeyStatus() {
    const savedKey = Storage.getApiKey();
    const input = document.getElementById("apiKeyInput");
    if (input && savedKey) {
      input.value = savedKey;
    }
    updateAiModeBadge();
  }

  window.saveApiKeyFromUI = async function () {
    const input = document.getElementById("apiKeyInput");
    const cleanKey = AIService.sanitizeApiKey(input ? input.value : "");
    if (input) input.value = cleanKey;
    Storage.setApiKey(cleanKey);
    AIService.resolvedModel = null;

    if (cleanKey && cleanKey.length > 10) {
      showToast("🔍 Đang kết nối và kiểm tra danh sách Model Gemini...");
      await AIService.discoverAvailableModels(cleanKey);
      updateAiModeBadge();
      Wow.playNotificationSound("booking_success");
      showToast(`✅ Đã kích hoạt AI Thật (${AIService.resolvedModel || "gemini-2.5-flash"})!`);
    } else {
      updateAiModeBadge();
      showToast("ℹ️ Đã chuyển về chế độ Engine kịch bản nội bộ.");
    }
  };

  function updateAiModeBadge() {
    const key = Storage.getApiKey();
    const badge = document.getElementById("aiModeBadge");
    if (!badge) return;
    if (key && key.length > 10) {
      const modelLabel = AIService.resolvedModel || "gemini-2.5-flash";
      badge.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      badge.textContent = `🟢 AI Thật: ${modelLabel}`;
    } else {
      badge.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40";
      badge.textContent = "⚡ Kịch bản Chuẩn (Chưa nhập Key)";
    }
  }

  function renderFaqList() {
    const container = document.getElementById("faqListContainer");
    if (!container) return;
    container.innerHTML = FAQ_DATA.map(
      (item, idx) => `
      <button type="button" onclick="window.askQuestion('${item.question.replace(/'/g, "\\'")}')"
        class="w-full text-left text-xs bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl px-3 py-2.5 text-slate-200 transition flex items-start gap-2 group">
        <span class="text-cyan-400 font-bold shrink-0">${idx + 1}.</span>
        <span class="group-hover:text-cyan-200 transition">${Validator.escapeHtml(item.question)}</span>
      </button>
    `
    ).join("");
  }

  window.handleChatSubmit = function (e) {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const rawText = input ? input.value : "";
    window.askQuestion(rawText, true);
  };

  window.askQuestion = async function (rawText, clearInput = false, forceSimulateError = false) {
    const check = Validator.validateChatMessage(rawText);
    const errorBanner = document.getElementById("chatErrorBanner");

    if (!check.valid) {
      if (errorBanner) {
        errorBanner.textContent = "⚠️ " + check.error;
        errorBanner.classList.remove("hidden");
      }
      return;
    }

    if (errorBanner) errorBanner.classList.add("hidden");
    if (clearInput) {
      const input = document.getElementById("chatInput");
      if (input) input.value = "";
    }

    appendUserMessage(check.sanitized);
    Wow.playNotificationSound("user");

    // Hiệu ứng bot đang gõ 3 chấm động (Kano Làm Mượt)
    const loaderId = appendTypingIndicator();

    const apiKey = Storage.getApiKey();
    const aiResponse = await AIService.generateResponse(check.sanitized, FAQ_DATA, apiKey, forceSimulateError);

    removeTypingIndicator(loaderId);

    if (!aiResponse.can_answer) {
      lastUnansweredQuestion = check.sanitized;
    }

    appendBotMessage(aiResponse.answer, aiResponse.can_answer, aiResponse.source, aiResponse.notice);
    Wow.playNotificationSound("bot");
    renderSuggestedQuestions(aiResponse.suggested_questions);
  };

  function appendUserMessage(text) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "flex justify-end msg-animate";
    div.innerHTML = `
      <div class="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[82%] shadow break-words">
        ${Validator.escapeHtml(text)}
      </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function appendBotMessage(text, canAnswer, sourceTag = "", notice = null, wowBookingRecord = null) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "flex justify-start items-start gap-2.5 msg-animate";

    const safeHtml = Validator.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-cyan-300 font-semibold'>$1</strong>")
      .replace(/\n/g, "<br/>");

    const sourceLabel =
      sourceTag === "GEMINI_API_REAL"
        ? `<span class="text-[10px] text-emerald-400 font-mono">✓ Gemini AI (${AIService.resolvedModel || "gemini-2.5-flash"})</span>`
        : sourceTag === "FALLBACK_RECOVERY"
        ? `<span class="text-[10px] text-amber-400 font-mono">🛡️ Fallback Recovery</span>`
        : `<span class="text-[10px] text-cyan-400/80 font-mono">✓ Trợ lý Kịch bản AI</span>`;

    const noticeHtml = notice
      ? `<div class="mb-2 text-[11px] bg-amber-500/15 border border-amber-500/40 text-amber-200 px-2.5 py-1.5 rounded-lg">${Validator.escapeHtml(notice)}</div>`
      : "";

    const ctaHtml = !canAnswer
      ? `
      <div class="mt-3 pt-3 border-t border-slate-600/80 flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs text-amber-300 font-medium">📅 Câu hỏi ngoài kịch bản FAQ — Đặt lịch gặp chuyên viên:</span>
        <button type="button" onclick="window.openBookingModal(true)"
          class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow">
          📅 Đặt lịch tư vấn ngay →
        </button>
      </div>
    `
      : "";

    // Thẻ ĐIỂM WOW: "Đã xác nhận lịch!" kèm nút Gửi xác nhận qua Zalo + Link thêm vào Google Calendar + Tải file .ics
    let wowCardHtml = "";
    if (wowBookingRecord) {
      latestBookingMap[wowBookingRecord.id] = wowBookingRecord;
      const gcalUrl = Wow.buildGoogleCalendarUrl(wowBookingRecord);
      wowCardHtml = `
        <div class="mt-3 p-3.5 rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-lg space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ✅ Đã xác nhận lịch! (${Validator.escapeHtml(wowBookingRecord.id)})
            </span>
            <span class="text-[11px] text-slate-400 font-mono">⏰ ${Validator.escapeHtml(wowBookingRecord.time)} | ${Validator.escapeHtml(wowBookingRecord.date)}</span>
          </div>
          <div class="text-xs text-slate-300 space-y-0.5">
            <div>👤 <strong>Khách hàng:</strong> ${Validator.escapeHtml(wowBookingRecord.name)} — 📞 <strong>${Validator.escapeHtml(wowBookingRecord.phone)}</strong></div>
            <div>📝 <strong>Nội dung:</strong> ${Validator.escapeHtml(wowBookingRecord.note)}</div>
          </div>
          <div class="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
            <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition shadow">
              📅 Thêm vào Google Calendar
            </a>
            <button type="button" onclick="window.shareBookingViaZalo('${Validator.escapeHtml(wowBookingRecord.id)}')"
              class="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow">
              💬 Gửi xác nhận qua Zalo
            </button>
            <button type="button" onclick="window.downloadBookingIcs('${Validator.escapeHtml(wowBookingRecord.id)}')"
              class="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg transition">
              📥 Tải tệp Lịch (.ics)
            </button>
          </div>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 mt-0.5">
        AI
      </div>
      <div class="bg-slate-800/95 border border-slate-700 text-slate-100 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[88%] shadow leading-relaxed">
        ${noticeHtml}
        <div>${safeHtml}</div>
        ${ctaHtml}
        ${wowCardHtml}
        <div class="mt-1.5 flex justify-end">${sourceLabel}</div>
      </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // Hành động gửi xác nhận qua Zalo (ĐIỂM WOW)
  window.shareBookingViaZalo = function (bookingId) {
    const rec = latestBookingMap[bookingId] || Storage.getBookings().find((b) => b.id === bookingId);
    if (!rec) return;
    const text = Wow.buildZaloConfirmationText(rec);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast("💬 Đã sao chép phiếu xác nhận & mở Zalo cho SĐT " + rec.phone + "!");
    window.open(`https://zalo.me/${encodeURIComponent(rec.phone)}`, "_blank", "noopener,noreferrer");
  };

  window.downloadBookingIcs = function (bookingId) {
    const rec = latestBookingMap[bookingId] || Storage.getBookings().find((b) => b.id === bookingId);
    if (!rec) return;
    Wow.downloadIcsFile(rec);
    showToast(`📥 Đã tải tệp Lịch hẹn ${rec.id}.ics!`);
  };

  function renderSuggestedQuestions(questions) {
    const container = document.getElementById("suggestedChips");
    if (!container) return;
    container.innerHTML = (questions || []).slice(0, 3).map(
      (q) => `
      <button type="button" onclick="window.askQuestion('${q.replace(/'/g, "\\'")}')"
        class="text-xs bg-slate-800 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-full transition text-left">
        ${Validator.escapeHtml(q)}
      </button>
    `
    ).join("");
  }

  // Hiệu ứng Bot đang gõ với 3 dấu chấm nhảy động (Kano Làm Mượt)
  function appendTypingIndicator() {
    const id = "loader_" + Date.now();
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.id = id;
    div.className = "flex justify-start items-center gap-2.5 msg-animate";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
        AI
      </div>
      <div class="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
        <div class="flex items-center gap-1">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        <span class="text-xs text-slate-300 italic">Trợ lý Tengi đang soạn phản hồi...</span>
      </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // =========================================================
  // QUẢN LÝ FORM ĐẶT LỊCH & TRANG QUẢN TRỊ (Yêu cầu 4 & 5)
  // =========================================================
  window.openBookingModal = function (prefill = false) {
    const modal = document.getElementById("bookingModal");
    const errBox = document.getElementById("bookingFormError");
    const noteEl = document.getElementById("bookNote");
    if (errBox) errBox.classList.add("hidden");

    // Luôn tự điền sẵn ngày giờ hôm nay khi mở form (Kano Làm Mượt)
    initSmartDateTimeDefaults();

    if (prefill && lastUnansweredQuestion && noteEl) {
      noteEl.value = `Cần tư vấn: ${lastUnansweredQuestion}`;
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  };

  window.closeBookingModal = function () {
    const modal = document.getElementById("bookingModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  window.handleBookingSubmit = function (e) {
    e.preventDefault();
    const rawData = {
      name: document.getElementById("bookName").value,
      phone: document.getElementById("bookPhone").value,
      date: document.getElementById("bookDate").value,
      time: document.getElementById("bookTime").value,
      note: document.getElementById("bookNote").value
    };

    const existing = Storage.getBookings();
    const validation = Validator.validateBookingForm(rawData, existing);
    const errBox = document.getElementById("bookingFormError");

    if (!validation.valid) {
      errBox.textContent = "❌ " + validation.error;
      errBox.classList.remove("hidden");
      const targetField = document.getElementById(validation.field);
      if (targetField) targetField.focus();
      return;
    }

    errBox.classList.add("hidden");
    const result = Storage.addBooking(validation.sanitized);

    if (!result.success) {
      errBox.textContent = "❌ " + result.error;
      errBox.classList.remove("hidden");
      return;
    }

    document.getElementById("bookingForm").reset();
    initSmartDateTimeDefaults();
    window.closeBookingModal();
    renderAdminBookings();

    const rec = result.record;
    Wow.playNotificationSound("booking_success");

    appendBotMessage(
      `🎉 **Đặt lịch tư vấn thành công!** Thông tin lịch hẹn của bạn đã được lưu vào hệ thống. Bạn có thể bấm nút bên dưới để **thêm lịch vào Google Calendar** hoặc **nhận phiếu xác nhận qua Zalo** ngay lập tức:`,
      true,
      "BOOKING_SYSTEM",
      null,
      rec
    );
    showToast(`✅ Đã xác nhận lịch hẹn ${rec.id} & tạo link Google Calendar / Zalo!`);
  };

  window.renderAdminBookings = function () {
    const bookings = Storage.getBookings();
    const tbody = document.getElementById("adminTableBody");
    const badge = document.getElementById("adminCountBadge");
    const statCount = document.getElementById("statTotalBookings");

    if (badge) badge.textContent = bookings.length;
    if (statCount) statCount.textContent = bookings.length;
    if (!tbody) return;

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-10 text-center text-slate-400 text-sm">
            Chưa có lịch hẹn nào trong <code class="text-cyan-400">localStorage</code>. Hãy đặt lịch từ Chatbot để kiểm tra!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings
      .map((b) => {
        latestBookingMap[b.id] = b;
        const gcalUrl = Wow.buildGoogleCalendarUrl(b);
        return `
      <tr class="hover:bg-slate-800/60 transition">
        <td class="py-3 px-4 font-mono text-xs text-cyan-400 font-bold">${Validator.escapeHtml(b.id)}</td>
        <td class="py-3 px-4 font-semibold text-white">${Validator.escapeHtml(b.name)}</td>
        <td class="py-3 px-4 text-slate-300 font-mono text-xs">${Validator.escapeHtml(b.phone)}</td>
        <td class="py-3 px-4">
          <span class="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-medium">
            ⏰ ${Validator.escapeHtml(b.time)} | ${Validator.escapeHtml(b.date)}
          </span>
        </td>
        <td class="py-3 px-4 text-xs text-slate-300 max-w-xs break-words">${Validator.escapeHtml(b.note)}</td>
        <td class="py-3 px-4 text-right space-x-1">
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer"
            class="inline-block bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
            📅 Lịch
          </a>
          <button type="button" onclick="window.shareBookingViaZalo('${Validator.escapeHtml(b.id)}')"
            class="bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
            💬 Zalo
          </button>
          <button type="button" onclick="window.deleteBooking('${Validator.escapeHtml(b.id)}')"
            class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
            ✓ Đã xử lý / Xóa
          </button>
        </td>
      </tr>
    `;
      })
      .join("");
  };

  window.deleteBooking = function (id) {
    Storage.deleteBookingById(id);
    renderAdminBookings();
    showToast(`🗑️ Đã xóa lịch hẹn ${id} khỏi localStorage.`);
  };

  window.clearAllBookings = function () {
    Storage.clearAll();
    renderAdminBookings();
    showToast("🗑️ Đã xóa toàn bộ lịch hẹn đã xử lý.");
  };

  window.switchTab = function (tabName) {
    const tabs = ["customer", "admin", "testcases"];
    tabs.forEach((t) => {
      const sec = document.getElementById(`view-${t}`);
      const btn = document.getElementById(`tab-${t}`);
      if (sec) {
        if (t === tabName) sec.classList.remove("hidden");
        else sec.classList.add("hidden");
      }
      if (btn) {
        if (t === tabName) {
          btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-blue-600 text-white flex items-center gap-1.5";
        } else {
          btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white flex items-center gap-1.5";
        }
      }
    });
    if (tabName === "admin") renderAdminBookings();
  };

  window.runTestCase = function (caseNumber) {
    const smart = Wow.getSmartDefaultDateTime();
    if (caseNumber === 1) {
      window.switchTab("customer");
      window.askQuestion("Giá gói lắp đặt nhà thông minh cơ bản là bao nhiêu?");
      showToast("▶️ Đang chạy Ca kiểm thử #1 (Bình thường - Hỏi FAQ)");
    } else if (caseNumber === 2) {
      const res = Validator.validateBookingForm(
        {
          name: "Phạm Nga Thế",
          phone: "0912345678",
          date: smart.defaultDate,
          time: "15:00",
          note: "Khảo sát lắp gói cơ bản chung cư Gò Vấp"
        },
        Storage.getBookings()
      );
      if (res.valid) {
        const added = Storage.addBooking(res.sanitized);
        Wow.playNotificationSound("booking_success");
        window.switchTab("customer");
        appendBotMessage(
          `🎉 **Đặt lịch tư vấn thành công (Ca kiểm thử TC-02)!**`,
          true,
          "BOOKING_SYSTEM",
          null,
          added.record
        );
      } else {
        window.switchTab("admin");
      }
      renderAdminBookings();
      showToast("✅ Ca kiểm thử #2: Đã tạo lịch hẹn kèm thẻ Xác nhận Zalo & Google Calendar!");
    } else if (caseNumber === 3) {
      window.switchTab("customer");
      window.openBookingModal();
      document.getElementById("bookName").value = "Nguyễn Văn B";
      document.getElementById("bookPhone").value = "12345abc";
      document.getElementById("bookDate").value = smart.defaultDate;
      document.getElementById("bookTime").value = "10:00";
      document.getElementById("bookingForm").dispatchEvent(new Event("submit", { cancelable: true }));
      showToast("⚠️ Ca kiểm thử #3: Đã chặn SĐT sai định dạng (12345abc)!");
    } else if (caseNumber === 4) {
      window.switchTab("customer");
      window.openBookingModal();
      document.getElementById("bookName").value = "Trần Thị C";
      document.getElementById("bookPhone").value = "0987654321";
      document.getElementById("bookDate").value = "2020-01-01";
      document.getElementById("bookTime").value = "09:00";
      document.getElementById("bookingForm").dispatchEvent(new Event("submit", { cancelable: true }));
      showToast("⚠️ Ca kiểm thử #4: Đã chặn đặt lịch hẹn trong quá khứ (01/01/2020)!");
    } else if (caseNumber === 5) {
      window.switchTab("customer");
      window.askQuestion("Chỉ cho tôi công thức nấu món phở bò ngon hoặc thiết kế mạch BMS 25 tầng?");
      showToast("▶️ Ca kiểm thử #5 (Chống lạc đề & Ngoài FAQ): Từ chối lịch sự & Đề xuất đặt lịch!");
    } else if (caseNumber === 6) {
      localStorage.setItem(Storage.STORAGE_KEY, "{corrupted_json_data!!!");
      Storage.getBookings();
      window.switchTab("customer");
      window.askQuestion("Chính sách bảo hành và đổi trả thiết bị như thế nào?", false, true);
      showToast("🛡️ Ca kiểm thử #6 (Sự cố): Tự phục hồi localStorage hỏng & kích hoạt AI Fallback!");
    }
  };

  function showToast(msg) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3800);
  }
})();
