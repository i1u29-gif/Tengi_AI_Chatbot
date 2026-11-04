/**
 * Tầng Tính Năng Nâng Cao "ĐIỂM WOW" & "LÀM MƯỢT" (Kano Attractive & Performance Layer)
 * 1. Âm thanh báo tin nhắn & xác nhận đặt lịch bằng Web Audio API (Không cần file MP3 ngoài, không bao giờ lỗi 404).
 * 2. Tạo Link thêm trực tiếp vào Google Calendar (Template URL chuẩn) & Tải file lịch (.ics).
 * 3. Gửi/Chia sẻ xác nhận lịch hẹn qua Zalo (`https://zalo.me/...` + Sao chép tin nhắn mẫu chuẩn Zalo).
 * 4. Tự động tính toán và điền sẵn Ngày hôm nay + Khung giờ hợp lệ gần nhất (Smart Auto-fill Today).
 */
window.TengiApp = window.TengiApp || {};

window.TengiApp.WowHelper = {
  soundEnabled: true,
  audioCtx: null,

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  },

  // Phát âm thanh "Pop / Ting" nhẹ nhàng khi có tin nhắn mới hoặc xác nhận lịch
  playNotificationSound(type = "bot") {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "user") {
        // Âm gửi đi nhẹ (440Hz -> 587Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "booking_success") {
        // Âm chuông đôi xác nhận thành công (523Hz -> 659Hz -> 784Hz)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.start(now);
        osc.stop(now + 0.42);
      } else {
        // Âm nhận tin nhắn từ Bot (660Hz -> 880Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chặn autoplay trước khi tương tác
    }
  },

  // Tự điền ngày giờ hôm nay thông minh (Kano Làm Mượt)
  getSmartDefaultDateTime() {
    const now = new Date();
    // Cộng thêm 30 phút làm tròn để luôn hợp lệ ở thời điểm hiện tại
    const future = new Date(now.getTime() + 30 * 60 * 1000);
    let hour = future.getHours();
    let minute = future.getMinutes() < 30 ? "30" : "00";
    if (minute === "00") {
      hour += 1;
    }

    let targetDate = new Date(now);
    // Nếu hiện tại sau 19:30 tối, mặc định giờ là 09:30 nhưng vẫn cho phép chọn hôm nay hoặc ngày mai
    if (hour >= 20) {
      hour = 9;
      minute = "30";
      targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (hour < 8) {
      hour = 8;
      minute = "30";
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const hh = String(hour).padStart(2, "0");

    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return {
      minDate: todayYMD,
      defaultDate: `${yyyy}-${mm}-${dd}`,
      defaultTime: `${hh}:${minute}`
    };
  },

  // Tạo Link thêm sự kiện trực tiếp vào Google Calendar (ĐIỂM WOW)
  buildGoogleCalendarUrl(booking) {
    try {
      const [year, month, day] = booking.date.split("-").map(Number);
      const [hour, minute] = booking.time.split(":").map(Number);

      const startLocal = new Date(year, month - 1, day, hour, minute, 0);
      const endLocal = new Date(startLocal.getTime() + 45 * 60 * 1000); // Thời lượng tư vấn 45 phút

      const formatGCalDate = (d) => {
        const pad = (n) => String(n).padStart(2, "0");
        return (
          d.getFullYear() +
          pad(d.getMonth() + 1) +
          pad(d.getDate()) +
          "T" +
          pad(d.getHours()) +
          pad(d.getMinutes()) +
          "00"
        );
      };

      const datesParam = `${formatGCalDate(startLocal)}/${formatGCalDate(endLocal)}`;
      const title = `[Tengi SmartHome] Lịch hẹn tư vấn (${booking.id}) - ${booking.name}`;
      const details = `Mã lịch hẹn: ${booking.id}\nKhách hàng: ${booking.name}\nSố điện thoại: ${booking.phone}\nNội dung tư vấn: ${booking.note}\nHotline hỗ trợ: 0909.888.999`;
      const location = "Showroom Tengi SmartHome - 12 Nguyễn Văn Bảo, P.4, Gò Vấp, TP.HCM (Hoặc Tư vấn Online/Tại nhà)";

      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: title,
        dates: datesParam,
        details: details,
        location: location
      });

      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch {
      return "https://calendar.google.com/";
    }
  },

  // Tạo nội dung xác nhận chuẩn Zalo
  buildZaloConfirmationText(booking) {
    return (
      `[XÁC NHẬN LỊCH HẸN - TENGI SMARTHOME]\n` +
      `✅ Mã lịch hẹn: ${booking.id}\n` +
      `👤 Khách hàng: ${booking.name}\n` +
      `📞 SĐT: ${booking.phone}\n` +
      `⏰ Thời gian: ${booking.time} ngày ${booking.date}\n` +
      `📝 Nội dung: ${booking.note}`
    );
  },

  // Tải file lịch .ics chuẩn về máy hoặc điện thoại
  downloadIcsFile(booking) {
    const [year, month, day] = booking.date.split("-").map(Number);
    const [hour, minute] = booking.time.split(":").map(Number);
    const pad = (n) => String(n).padStart(2, "0");
    const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    const endHour = hour + 1 <= 23 ? hour + 1 : hour;
    const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tengi SmartHome//VibeCoding2026//VI",
      "BEGIN:VEVENT",
      `UID:${booking.id}@tengismarthome.vn`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:[Tengi SmartHome] Lịch tư vấn ${booking.id} - ${booking.name}`,
      `DESCRIPTION:Khách hàng: ${booking.name} (${booking.phone}) - Nội dung: ${booking.note}`,
      "LOCATION:12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lich_Hen_${booking.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
