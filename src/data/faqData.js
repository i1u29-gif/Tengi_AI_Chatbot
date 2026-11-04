/**
 * Tầng Dữ Liệu (Data Layer): Bộ kiến thức 10 câu hỏi thường gặp (FAQ)
 * Chủ đề: Doanh nghiệp nhỏ Tengi SmartHome & IoT Solutions
 */
window.TengiApp = window.TengiApp || {};

window.TengiApp.FAQ_DATA = [
  {
    id: "FAQ-01",
    category: "Thông tin chung",
    question: "Giờ làm việc và địa chỉ showroom của Tengi ở đâu?",
    keywords: [
      "giờ làm việc", "mở cửa", "đồng hồ", "mấy giờ", "địa chỉ", "showroom",
      "ở đâu", "văn phòng", "chi nhánh", "cửa hàng", "tới xem", "gio lam viec", "dia chi", "o dau"
    ],
    answer: "Showroom Tengi SmartHome mở cửa từ 08:00 đến 20:00 tất cả các ngày trong tuần (kể cả Thứ 7 và Chủ Nhật) tại địa chỉ: Số 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP.HCM.",
    relatedIds: ["FAQ-02", "FAQ-05", "FAQ-03"]
  },
  {
    id: "FAQ-02",
    category: "Báo giá",
    question: "Giá gói lắp đặt nhà thông minh cơ bản là bao nhiêu?",
    keywords: [
      "giá", "chi phí", "bao nhiêu tiền", "gói cơ bản", "báo giá", "lắp đặt",
      "rẻ nhất", "tiền", "bảng giá", "đắt không", "gia bao nhieu", "chi phi", "bao gia"
    ],
    answer: "Gói SmartHome Cơ Bản cho căn hộ 1–2 phòng ngủ có giá trọn gói là 4.900.000đ, bao gồm: 01 Bộ điều khiển trung tâm Zigbee, 04 Công tắc cảm ứng thông minh và 02 Cảm biến chuyển động.",
    relatedIds: ["FAQ-07", "FAQ-04", "FAQ-03"]
  },
  {
    id: "FAQ-03",
    category: "Bảo hành",
    question: "Chính sách bảo hành và đổi trả thiết bị như thế nào?",
    keywords: [
      "bảo hành", "hỏng", "lỗi", "đổi trả", "sửa chữa", "1 đổi 1",
      "bảo trì", "hư", "bao lâu", "bao hanh", "doi tra", "sua chua"
    ],
    answer: "Toàn bộ thiết bị tại Tengi được bảo hành chính hãng 24 tháng, áp dụng 1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi phần cứng từ nhà sản xuất và miễn phí hỗ trợ kỹ thuật tại nhà 12 tháng đầu.",
    relatedIds: ["FAQ-06", "FAQ-02", "FAQ-09"]
  },
  {
    id: "FAQ-04",
    category: "Thi công",
    question: "Thời gian thi công lắp đặt mất bao lâu?",
    keywords: [
      "thời gian", "bao lâu", "thi công", "lắp mất mấy ngày", "nhanh không",
      "tiến độ", "mấy tiếng", "mấy ngày", "thoi gian", "thi cong", "bao lau"
    ],
    answer: "Thời gian lắp đặt tiêu chuẩn chỉ từ 2 đến 4 giờ đối với căn hộ chung cư và từ 1 đến 2 ngày đối với nhà phố/biệt thự. Quá trình thi công sạch sẽ, không cần đục phá tường.",
    relatedIds: ["FAQ-09", "FAQ-05", "FAQ-02"]
  },
  {
    id: "FAQ-05",
    category: "Dịch vụ",
    question: "Cửa hàng có hỗ trợ khảo sát tận nơi miễn phí không?",
    keywords: [
      "khảo sát", "tận nơi", "tại nhà", "miễn phí", "kiểm tra",
      "tư vấn tại nhà", "xuống nhà", "khao sat", "mien phi", "tan noi"
    ],
    answer: "Có! Đội ngũ kỹ thuật viên Tengi hỗ trợ khảo sát hạ tầng điện và mang vali thiết bị mẫu đến demo trực tiếp tại nhà khách hàng hoàn toàn miễn phí trong khu vực TP.HCM.",
    relatedIds: ["FAQ-01", "FAQ-04", "FAQ-02"]
  },
  {
    id: "FAQ-06",
    category: "Kỹ thuật",
    question: "Khi mất mạng Internet hoặc Wi-Fi thì thiết bị có hoạt động không?",
    keywords: [
      "mất mạng", "internet", "wifi", "wi-fi", "offline", "mất kết nối",
      "rớt mạng", "đứt cáp", "mat mang", "mat wifi"
    ],
    answer: "Hệ thống vẫn hoạt động bình thường! Các công tắc cảm ứng vẫn bật/tắt trực tiếp bằng tay và các kịch bản tự động nội bộ thông qua bộ trung tâm Zigbee vẫn vận hành độc lập không cần Internet.",
    relatedIds: ["FAQ-08", "FAQ-10", "FAQ-03"]
  },
  {
    id: "FAQ-07",
    category: "Thanh toán",
    question: "Có hỗ trợ trả góp không và chấp nhận hình thức thanh toán nào?",
    keywords: [
      "trả góp", "thanh toán", "chuyển khoản", "thẻ tín dụng", "lãi suất",
      "trả trước", "quẹt thẻ", "tra gop", "thanh toan"
    ],
    answer: "Tengi hỗ trợ trả góp 0% lãi suất kỳ hạn 3–6 tháng qua thẻ tín dụng của 25 ngân hàng nội địa, đồng thời chấp nhận thanh toán tiền mặt, chuyển khoản VietQR và ví điện tử.",
    relatedIds: ["FAQ-02", "FAQ-03", "FAQ-05"]
  },
  {
    id: "FAQ-08",
    category: "Kỹ thuật",
    question: "Thiết bị điều khiển qua điện thoại bằng ứng dụng gì?",
    keywords: [
      "ứng dụng", "app", "điện thoại", "ios", "android", "giọng nói",
      "google home", "siri", "apple homekit", "alexa", "ung dung", "dieu khien"
    ],
    answer: "Khách hàng điều khiển thiết bị qua ứng dụng tiếng Việt trên cả iOS và Android, hỗ trợ ra lệnh giọng nói tiếng Việt và tích hợp mượt mà với Apple HomeKit, Google Home và Alexa.",
    relatedIds: ["FAQ-06", "FAQ-10", "FAQ-09"]
  },
  {
    id: "FAQ-09",
    category: "Thi công",
    question: "Nhà đang ở sẵn có lắp được không hay phải nhà mới xây?",
    keywords: [
      "nhà cũ", "đang ở", "mới xây", "đục tường", "thay công tắc",
      "cải tạo", "đi lại dây", "nha dang o", "nha cu", "duc tuong"
    ],
    answer: "Nhà đang ở lắp đặt rất dễ dàng! Thiết bị được thiết kế chuẩn đế âm tường chữ nhật và đế vuông thông dụng tại Việt Nam, kỹ thuật viên chỉ cần tháo công tắc cơ cũ và lắp công tắc thông minh vào.",
    relatedIds: ["FAQ-04", "FAQ-05", "FAQ-02"]
  },
  {
    id: "FAQ-10",
    category: "An ninh",
    question: "Hệ thống camera và khóa vân tay có cảnh báo chống trộm tự động không?",
    keywords: [
      "camera", "khóa vân tay", "chống trộm", "an ninh", "cảnh báo",
      "báo động", "đột nhập", "còi hú", "chong trom", "khoa van tay"
    ],
    answer: "Có! Khi phát hiện cạy cửa hoặc chuyển động trái phép vào ban đêm, hệ thống tự động bật sáng toàn bộ đèn, kích hoạt còi hú 110dB và gửi thông báo kèm hình ảnh tức thời về điện thoại.",
    relatedIds: ["FAQ-06", "FAQ-08", "FAQ-03"]
  }
];
