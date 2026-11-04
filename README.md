# ĐỀ 4: CHATBOT FAQ & ĐẶT LỊCH TƯ VẤN (VIBE CODING 2026)

- **Đội thi:** ĐỘI_TENGI
- **Bảng thi:** Bảng A
- **Đề bài:** Đề 4 – Chatbot FAQ & đặt lịch tư vấn cho doanh nghiệp nhỏ hoạt động 24/7 (`Tengi SmartHome Care 24/7`)

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Frontend:** HTML5, Tailwind CSS (Responsive Desktop & Mobile), Vanilla JavaScript (ES6+ thiết kế phân tầng mô-đun).
- **Tích hợp AI thật (Real AI Integration):** Google Gemini API (`gemini-2.5-flash`) thông qua REST API với cơ chế ép kiểu đầu ra **Structured JSON Schema** (`responseMimeType: "application/json"`).
- **Cơ chế dự phòng (Fallback Engine):** Local NLP Keyword & Semantic Scoring giúp ứng dụng luôn hoạt động ổn định 100% ngay cả khi chưa nhập API Key hoặc gặp sự cố mất mạng / hết hạn mức API.
- **Lưu trữ dữ liệu:** `localStorage` cho danh sách lịch hẹn (`tengi_appointments_v1`) và `sessionStorage` cho khóa API tạm thời (đảm bảo **không lộ khóa API trong mã nguồn** theo quy định của BTC).

---

## 2. Cấu trúc thư mục mã nguồn (Architecture)

```text
DOI_TENGI_De4_VibeCoding2026/
├── index.html                  # Giao diện chính (Khách hàng, Quản trị, Bảng 6 Ca Kiểm Thử)
├── config.example.js           # File cấu hình mẫu (Không chứa API Key thật)
├── .env.example                # Biến môi trường mẫu theo chuẩn bảo mật BTC
├── README.md                   # Tài liệu hướng dẫn đầy đủ theo quy định nộp bài
├── styles/
│   └── main.css                # CSS tùy chỉnh & hiệu ứng chuyển động
└── src/
    ├── data/
    │   └── faqData.js          # Bộ kiến thức 10 câu hỏi thường gặp (FAQ Knowledge Base)
    ├── utils/
    │   └── validator.js        # Kiểm tra đầu vào, chống XSS, chuẩn hóa JSON đầu ra từ AI
    ├── services/
    │   ├── storageService.js   # Quản lý localStorage an toàn kèm tự phục hồi (Self-healing)
    │   └── aiService.js        # Kết nối Gemini 2.5 Flash API + Kiểm soát đầu ra + Timeout/Fallback
    └── app.js                  # Điều phối luồng sự kiện UI và chạy tự động 6 ca kiểm thử
```

---

## 3. Năm (05) tính năng cốt lõi đã hoàn thành

1. **Trả lời 10 câu hỏi thường gặp (FAQ):** Xây dựng bộ kiến thức 10 câu FAQ thực tế của doanh nghiệp `Tengi SmartHome` (giờ làm việc, báo giá gói cơ bản, bảo hành 24 tháng, thời gian thi công, khảo sát miễn phí, hoạt động khi mất Internet, trả góp, ứng dụng điều khiển, lắp cho nhà đang ở, an ninh chống trộm).
2. **AI diễn đạt tự nhiên & Gợi ý 03 câu hỏi liên quan:** AI tổng hợp và diễn đạt lại câu trả lời mượt mà, đồng thời luôn sinh đúng 03 câu hỏi gợi ý dưới dạng nút bấm nhanh (Quick Reply Chips) sau mỗi lượt trả lời.
3. **Chủ động đề xuất đặt lịch khi không trả lời được:** Khi câu hỏi nằm ngoài phạm vi 10 câu FAQ (`can_answer: false`), Chatbot lịch sự thông báo và hiển thị nút **"Đặt lịch tư vấn với nhân viên"**, tự động điền nội dung câu hỏi tồn đọng vào ô ghi chú của Form.
4. **Form đặt lịch lưu `localStorage`:** Cho phép chọn ngày/giờ, nhập họ tên, số điện thoại (kiểm tra đúng 10 số chuẩn Việt Nam, chặn ngày quá khứ, chặn ngoài khung giờ 08:00–20:00, chặn trùng lịch) và lưu vào `localStorage`.
5. **Trang quản trị đơn giản (Admin Dashboard):** Xem danh sách lịch hẹn theo thời gian thực, thống kê tổng số lịch hẹn và xóa từng lịch hẹn hoặc xóa toàn bộ lịch đã xử lý.

---

## 4. Hướng dẫn cách chạy (How to Run)

### Cách 1: Chạy trực tiếp (Không cần cài đặt)
- Giải nén file `DOI_TENGI_De4_VibeCoding2026.zip`.
- Mở trực tiếp file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).

### Cách 2: Chạy qua Local Web Server (Khuyến nghị)
```bash
# Sử dụng Python
python -m http.server 5500
# Hoặc sử dụng Node.js
npx serve .
```
Sau đó truy cập `http://localhost:5500`.

### Cách kích hoạt AI thật (Gemini API):
1. Dán khóa `GEMINI_API_KEY` vào ô **"Dán Gemini API Key (AI thật)..."** trên thanh Header của ứng dụng và bấm **"Lưu Key"**.
2. Biểu tượng trạng thái sẽ chuyển sang **"🟢 AI Thật: Gemini 2.5 Flash"**. Khóa chỉ lưu trong `sessionStorage` của trình duyệt, tuyệt đối không lưu cứng trong mã nguồn.

---

## 5. AI sử dụng & Kiểm soát đầu ra

- **Trong quá trình phát triển (Vibe Coding):** Sử dụng AI hỗ trợ phân rã kiến trúc 4 tầng (`Data` – `Validator` – `Service` – `UI`), thiết kế System Prompt ép kiểu JSON và xây dựng bộ kiểm thử biên.
- **Tích hợp trong sản phẩm:** Sử dụng model `gemini-2.5-flash` với `responseMimeType: "application/json"`.
- **Kiểm soát đầu ra (`Validator.validateAndNormalizeAIOutput`):**
  - Bắt buộc phản hồi từ AI phải có trường `answer` (chuỗi không rỗng) và `can_answer` (`boolean`).
  - Nếu AI trả về thiếu hoặc thừa số lượng câu hỏi gợi ý, hàm chuẩn hóa sẽ tự động bổ sung/cắt gọn để **luôn hiển thị đúng 03 câu hỏi gợi ý hợp lệ**.

---

## 6. Bảng 06 Ca Kiểm Tra Thực Tế (Yêu cầu Bảng A)

*(Có thể kiểm tra thủ công hoặc bấm chạy trực tiếp trong tab **"🧪 6 Ca Kiểm Thử (Bảng A)"** ngay trên giao diện)*

| Mã Ca | Phân loại | Đầu vào / Thao tác | Kết quả mong đợi | Kết quả thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Bình thường #1** | Hỏi câu trong FAQ: *"Giá gói lắp đặt nhà thông minh cơ bản là bao nhiêu?"* | AI diễn đạt tự nhiên báo giá 4.900.000đ + hiển thị đúng 03 câu hỏi gợi ý. | **ĐẠT (PASS):** Trả lời tự nhiên đúng dữ liệu mẫu, hiện đúng 03 câu hỏi liên quan bên dưới. |
| **TC-02** | **Bình thường #2** | Đặt lịch hợp lệ: Tên *"Phạm Nga Thế"*, SĐT *"0912345678"*, ngày hiện tại, giờ *"15:00"*. | Lưu thành công vào `localStorage`, hiển thị trên Trang quản trị và xóa được khi bấm *"Đã xử lý"*. | **ĐẠT (PASS):** Tạo mã `LH-xxxxxx`, lưu vào `localStorage`, hiển thị và xóa thành công ở trang Quản trị. |
| **TC-03** | **Không hợp lệ #1** | Nhập SĐT sai định dạng: `"12345abc"` hoặc chỉ nhập `"09123"` trong Form đặt lịch. | Chặn gửi form, hiển thị lỗi yêu cầu SĐT 10 chữ số chuẩn Việt Nam. | **ĐẠT (PASS):** Hệ thống chặn lưu, hiện thông báo lỗi màu đỏ rõ ràng và đặt con trỏ vào ô SĐT. |
| **TC-04** | **Không hợp lệ #2** | Chọn ngày hẹn trong quá khứ (`01/01/2020`) hoặc để trống tin nhắn chat (`"   "`). | Chặn đặt lịch quá khứ và chặn gửi tin nhắn rỗng. | **ĐẠT (PASS):** Hệ thống báo lỗi *"Không thể đặt lịch hẹn trong quá khứ!"* và không ghi vào `localStorage`. |
| **TC-05** | **Ca biên #1** | Hỏi câu ngoài bộ 10 FAQ: *"Thiết kế hệ thống BMS công nghiệp cho tòa nhà 25 tầng tại Hà Nội..."* | AI không bịa câu trả lời (`can_answer: false`), chủ động mời đặt lịch tư vấn với nhân viên. | **ĐẠT (PASS):** Chatbot đề xuất đặt lịch, hiển thị nút mở Form và tự điền câu hỏi vào mục Ghi chú. |
| **TC-06** | **Ca sự cố #2** | Giả lập mất kết nối Gemini API (Timeout/Network Error) & dữ liệu `localStorage` bị hỏng (`{corrupted_json`). | Ứng dụng không bị treo/trắng trang; tự phục hồi `localStorage` và chuyển sang Engine dự phòng. | **ĐẠT (PASS):** `StorageService` tự reset JSON hỏng về `[]`, `AIService` trả lời qua Fallback Recovery kèm thông báo rõ ràng. |

---

## 7. Giới hạn hiện tại & Hướng phát triển

- **Giới hạn:** Dữ liệu lịch hẹn hiện lưu trữ cục bộ trên trình duyệt (`localStorage`) theo đúng yêu cầu đề bài nên chưa đồng bộ giữa nhiều thiết bị khác nhau; khóa Gemini API được nhập từ phía Client để phục vụ chấm thi không cần Backend.
- **Hướng nâng cấp:** Tích hợp Backend FastAPI / Node.js để ẩn khóa API phía Server, lưu lịch hẹn vào cơ sở dữ liệu đám mây và gửi thông báo tự động qua Zalo OA / Telegram cho nhân viên trực.

---

## 8. Nguồn tham khảo

1. Tài liệu chính thức Google Gemini API (`generateContent` & Structured Outputs JSON): https://ai.google.dev/gemini-api/docs
2. Tài liệu Tailwind CSS v3: https://tailwindcss.com/docs
3. Tài liệu MDN Web Docs – `Window.localStorage`: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
