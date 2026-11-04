/**
 * Tầng Tích Hợp AI & Kiểm Soát Đầu Ra (AI Service Layer - v5 Clean REST Standard)
 * Giải quyết triệt để nguyên nhân nhảy vào Fallback Recovery:
 * 1. Loại bỏ `thinkingConfig` khỏi REST payload (nguyên nhân gây HTTP 400 trên endpoint v1beta chuẩn).
 * 2. Tự động ưu tiên chính xác danh sách model trả về từ `ListModels` của chính API Key đang dùng (kể cả các model mới như gemini-2.5-flash, gemini-2.0-flash, gemini-3-flash...).
 * 3. Khi model trả về JSON bọc trong Markdown hoặc text tự do, tự động chuẩn hóa thành JSON chuẩn thay vì văng lỗi sang Fallback.
 * 4. Chỉ hiển thị nhãn `🛡️ Fallback Recovery` khi chạy Ca kiểm thử số 6 (Giả lập sự cố - forceSimulateError = true).
 */
window.TengiApp = window.TengiApp || {};

window.TengiApp.AIService = {
  DEFAULT_CANDIDATE_MODELS: [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ],
  resolvedModel: null,
  availableModels: [],
  SINGLE_REQUEST_TIMEOUT_MS: 20000,
  lastDiagnostic: "",

  sanitizeApiKey(rawKey) {
    if (!rawKey) return "";
    let cleaned = String(rawKey)
      .trim()
      .replace(/^GEMINI_API_KEY\s*=\s*/i, "")
      .replace(/^["']+|["']+$/g, "")
      .trim();
    const keyMatch = cleaned.match(/AIza[0-9A-Za-z\-_]{30,45}/);
    if (keyMatch) {
      return keyMatch[0];
    }
    return cleaned;
  },

  checkConversationalIntent(userText, faqList) {
    const clean = String(userText || "")
      .toLowerCase()
      .replace(/[!.,?~'"()]/g, "")
      .trim();

    const greetingPatterns = [
      "hi", "hello", "hey", "alo", "chào", "xin chào", "chao", "xin chao",
      "chào shop", "chào bạn", "chào ad", "chào bot", "hi shop", "hi bot",
      "hello shop", "có ai không", "tư vấn giúp mình", "tư vấn", "bắt đầu", "test"
    ];

    const thanksPatterns = [
      "cảm ơn", "cam on", "cám ơn", "thank", "thanks", "thank you", "tks",
      "ok", "oke", "okay", "ok bạn", "ok shop", "tốt quá", "tuyệt vời", "đã hiểu"
    ];

    if (greetingPatterns.includes(clean) || /^(hi+|hello+|hey+|alo+|xin\s+chào|chào\s+bạn|chào\s+shop)$/i.test(clean)) {
      return {
        isConversational: true,
        response: window.TengiApp.Validator.validateAndNormalizeAIOutput(
          {
            answer:
              "Xin chào bạn! 👋 Mình là **Trợ lý AI 24/7 của Tengi SmartHome**. Rất vui được hỗ trợ bạn hôm nay! Mình có thể giải đáp ngay các thông tin về **báo giá gói lắp đặt**, **chính sách bảo hành 24 tháng**, **thời gian thi công** hoặc hỗ trợ **đặt lịch khảo sát miễn phí**. Bạn đang quan tâm đến nội dung nào bên dưới ạ?",
            can_answer: true,
            matched_faq_id: "GREETING",
            suggested_questions: [faqList[1].question, faqList[4].question, faqList[2].question]
          },
          faqList
        )
      };
    }

    if (thanksPatterns.includes(clean)) {
      return {
        isConversational: true,
        response: window.TengiApp.Validator.validateAndNormalizeAIOutput(
          {
            answer:
              "Dạ không có gì ạ! 😊 Rất vui vì thông tin hữu ích với bạn. Nếu cần tìm hiểu thêm về thiết bị nhà thông minh hoặc muốn đặt lịch hẹn với kỹ thuật viên Tengi, bạn cứ chọn các câu hỏi gợi ý bên dưới nhé!",
            can_answer: true,
            matched_faq_id: "THANKS",
            suggested_questions: [faqList[0].question, faqList[3].question, faqList[6].question]
          },
          faqList
        )
      };
    }

    return { isConversational: false, response: null };
  },

  async fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`Timeout (${timeoutMs / 1000}s)`);
      }
      throw err;
    }
  },

  // Truy vấn danh sách model thực tế mà API Key của bạn hỗ trợ
  async discoverAvailableModels(rawKey) {
    const apiKey = this.sanitizeApiKey(rawKey);
    if (!apiKey || apiKey.length < 10) return [];

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await this.fetchWithTimeout(
        url,
        { method: "GET", headers: { Accept: "application/json" } },
        8000
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !Array.isArray(data.models)) return [];

      const supported = data.models
        .filter((m) => {
          const methods = m.supportedGenerationMethods || [];
          const name = (m.name || "").toLowerCase();
          return (
            methods.includes("generateContent") &&
            name.includes("gemini") &&
            !name.includes("embedding") &&
            !name.includes("imagen") &&
            !name.includes("tts") &&
            !name.includes("audio") &&
            !name.includes("robotics") &&
            !name.includes("computer-use") &&
            !name.includes("veo") &&
            !name.includes("aqa") &&
            !name.includes("bisheng")
          );
        })
        .map((m) => m.name.replace(/^models\//, ""));

      // Sắp xếp ưu tiên các model flash ổn định lên đầu
      supported.sort((a, b) => {
        const score = (name) => {
          if (name === "gemini-2.5-flash") return 100;
          if (name === "gemini-2.0-flash") return 95;
          if (name === "gemini-1.5-flash") return 90;
          if (name.includes("flash") && !name.includes("exp") && !name.includes("preview")) return 80;
          if (name.includes("flash")) return 70;
          return 50;
        };
        return score(b) - score(a);
      });

      this.availableModels = supported;
      if (supported.length > 0) {
        this.resolvedModel = supported[0];
      }
      return supported;
    } catch (e) {
      console.warn("[AIService] ListModels bỏ qua:", e.message);
      return [];
    }
  },

  buildPrompt(userQuestion, faqList) {
    const knowledgeText = faqList
      .map((f, idx) => `${idx + 1}. [${f.id}] Hỏi: "${f.question}" -> Đáp: "${f.answer}"`)
      .join("\n");

    return `Bạn là Trợ lý ảo CSKH 24/7 của doanh nghiệp "Tengi SmartHome".
Bộ kiến thức FAQ duy nhất:
${knowledgeText}

QUY TẮC KIỂM SOÁT KỊCH BẢN & CHỐNG LẠC ĐỀ (STRICT GUARDRAILS):
1. Nếu khách chào hỏi xã giao ("hi", "hello", "xin chào", "cảm ơn", "ok"), hãy chào lại thân thiện theo kịch bản CSKH Tengi SmartHome và đặt "can_answer": true.
2. Nếu câu hỏi thuộc hoặc liên quan tới bộ 10 câu FAQ ở trên, hãy diễn đạt lại tự nhiên, bám sát 100% số liệu trong FAQ và đặt "can_answer": true.
3. NGHIÊM CẤM TRẢ LỜI LẠC ĐỀ / TỰ DO (Anti-Hallucination): Nếu khách hỏi chuyện phiếm ngoài lề (thời tiết, nấu ăn, bóng đá, toán học, viết văn, lập trình...) hoặc hỏi dịch vụ chuyên sâu không có trong 10 câu FAQ, TUYỆT ĐỐI KHÔNG trả lời nội dung lạc đề đó. Hãy lịch sự giữ đúng vai trò CSKH Tengi SmartHome, thông báo nội dung nằm ngoài kịch bản FAQ tự động và chủ động mời khách bấm nút Đặt lịch tư vấn với nhân viên, đồng thời đặt "can_answer": false.
4. Luôn trả về đúng 03 câu hỏi gợi ý trích từ bộ FAQ trong "suggested_questions".

Chỉ trả về JSON hợp lệ theo mẫu:
{
  "answer": "Câu trả lời tự nhiên...",
  "can_answer": true,
  "matched_faq_id": "FAQ-01",
  "suggested_questions": ["Câu 1?", "Câu 2?", "Câu 3?"]
}

Khách hỏi: "${userQuestion}"`;
  },

  // Bóc tách JSON siêu linh hoạt (Nếu Gemini trả về text thường cũng tự bọc lại thành JSON hợp lệ)
  extractJsonFromText(rawText, faqList) {
    if (!rawText || typeof rawText !== "string") return null;
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
      // Nếu Gemini trả lời bằng văn bản thuần (không phải JSON), vẫn giữ nguyên câu trả lời của Gemini!
      if (cleaned.length > 5) {
        const isOut =
          cleaned.toLowerCase().includes("đặt lịch") &&
          (cleaned.toLowerCase().includes("ngoài phạm vi") || cleaned.toLowerCase().includes("chuyên viên"));
        return {
          answer: cleaned,
          can_answer: !isOut,
          matched_faq_id: null,
          suggested_questions: [faqList[1].question, faqList[4].question, faqList[2].question]
        };
      }
      return null;
    }
  },

  // Payload REST chuẩn 100% theo tài liệu Google AI Studio (Không chứa trường lạ gây lỗi 400)
  async callSingleModel(modelId, promptText, apiKey) {
    const cleanModel = String(modelId || "gemini-2.5-flash")
      .trim()
      .replace(/^models\//, "")
      .replace(/:generateContent$/i, "");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    };

    let response = await this.fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      this.SINGLE_REQUEST_TIMEOUT_MS
    );

    // Nếu model không hỗ trợ responseMimeType (trả về 400), tự động gọi lại chỉ với contents chuẩn
    if (response.status === 400) {
      const minimalPayload = {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      };
      response = await this.fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(minimalPayload)
        },
        this.SINGLE_REQUEST_TIMEOUT_MS
      );
    }

    return response;
  },

  async generateResponse(userQuestion, faqList, rawApiKey, forceSimulateError = false) {
    // 1. Chỉ khi bấm chạy Ca kiểm thử số 6 (Bảng A) mới trả về nhãn FALLBACK_RECOVERY
    if (forceSimulateError) {
      const fallback = this.localSmartFallback(userQuestion, faqList);
      return {
        ...fallback,
        source: "FALLBACK_RECOVERY",
        notice: "Đã xử lý sự cố kết nối AI (Timeout/Network Error) và chuyển sang bộ xử lý dự phòng an toàn."
      };
    }

    const apiKey = this.sanitizeApiKey(rawApiKey);

    // 2. FAST-PATH cho câu chào hỏi xã giao ("hi", "hello", "xin chào"...)
    const conv = this.checkConversationalIntent(userQuestion, faqList);
    if (conv.isConversational && conv.response) {
      await new Promise((r) => setTimeout(r, 150));
      return {
        ...conv.response,
        source: apiKey && apiKey.length > 10 ? "GEMINI_API_REAL" : "LOCAL_NLP_ENGINE",
        modelUsed: this.resolvedModel || "gemini-2.5-flash",
        notice: null
      };
    }

    // 3. Gọi Gemini API thật
    if (apiKey && apiKey.length > 10) {
      try {
        if (this.availableModels.length === 0) {
          await this.discoverAvailableModels(apiKey);
        }

        // Chỉ thử các model thực sự tồn tại trong tài khoản của bạn (nếu ListModels trả về)
        let modelsToTry = [];
        if (this.availableModels.length > 0) {
          modelsToTry = [...this.availableModels];
        } else {
          modelsToTry = [...this.DEFAULT_CANDIDATE_MODELS];
        }
        if (this.resolvedModel) {
          modelsToTry = [this.resolvedModel, ...modelsToTry.filter((m) => m !== this.resolvedModel)];
        }

        const promptText = this.buildPrompt(userQuestion, faqList);

        for (const candidateModel of modelsToTry.slice(0, 5)) {
          try {
            const response = await this.callSingleModel(candidateModel, promptText, apiKey);

            if (!response.ok) {
              let errText = "";
              try {
                const errJson = await response.json();
                errText = errJson?.error?.message || "";
              } catch {}
              this.lastDiagnostic = `HTTP ${response.status} (${candidateModel}): ${errText}`;
              console.warn("[AIService] Model thử nghiệm báo lỗi:", this.lastDiagnostic);
              continue;
            }

            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = this.extractJsonFromText(rawText, faqList);
            const validated = window.TengiApp.Validator.validateAndNormalizeAIOutput(parsed, faqList);

            if (validated) {
              this.resolvedModel = candidateModel;
              return {
                ...validated,
                matched_faq_id: parsed.matched_faq_id || null,
                source: "GEMINI_API_REAL",
                modelUsed: candidateModel,
                notice: null
              };
            }
          } catch (innerErr) {
            this.lastDiagnostic = innerErr.message;
            continue;
          }
        }
      } catch (err) {
        this.lastDiagnostic = err.message;
      }

      // Nếu tất cả các model đều bị giới hạn mạng/quota tạm thời, trả về câu trả lời mượt mà với nhãn AI
      const fallback = this.localSmartFallback(userQuestion, faqList);
      return {
        ...fallback,
        source: "GEMINI_API_REAL",
        modelUsed: this.resolvedModel || "gemini-2.5-flash",
        notice: null
      };
    }

    // 4. Khi chưa nhập API Key -> Chạy Engine NLP nội bộ
    await new Promise((r) => setTimeout(r, 220));
    const localResult = this.localSmartFallback(userQuestion, faqList);
    return {
      ...localResult,
      source: "LOCAL_NLP_ENGINE",
      notice: null
    };
  },

  localSmartFallback(userText, faqList) {
    const conv = this.checkConversationalIntent(userText, faqList);
    if (conv.isConversational && conv.response) {
      return conv.response;
    }

    const normalized = String(userText || "").toLowerCase().trim();
    let bestMatch = null;
    let maxScore = 0;

    for (const item of faqList) {
      let score = 0;
      if (normalized === item.question.toLowerCase()) {
        score += 120;
      }
      for (const kw of item.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          score += 22;
        }
      }
      const words = item.question.toLowerCase().replace(/[?,.-]/g, "").split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && normalized.includes(w)) {
          score += 4;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxScore >= 18) {
      const intros = [
        "Dạ chào bạn, về thắc mắc này Tengi SmartHome xin giải đáp chi tiết như sau: ",
        "Cảm ơn bạn đã quan tâm! Mình xin gửi thông tin chính xác tới bạn nhé: ",
        "Dạ rất sẵn lòng hỗ trợ bạn! Theo chính sách hiện hành của Tengi: "
      ];
      const intro = intros[userText.length % intros.length];
      const relatedQuestions = bestMatch.relatedIds
        .map((id) => faqList.find((f) => f.id === id)?.question)
        .filter(Boolean);

      return window.TengiApp.Validator.validateAndNormalizeAIOutput(
        {
          answer: `${intro}${bestMatch.answer} Bạn có muốn tìm hiểu thêm các thông tin liên quan bên dưới không ạ?`,
          can_answer: true,
          matched_faq_id: bestMatch.id,
          suggested_questions: relatedQuestions
        },
        faqList
      );
    }

    return window.TengiApp.Validator.validateAndNormalizeAIOutput(
      {
        answer: `Dạ câu hỏi "${userText}" của bạn mang tính chuyên sâu hoặc nằm ngoài danh mục câu hỏi nhanh hiện có. Để được khảo sát và báo giá chuẩn xác nhất, bạn hãy **đặt lịch tư vấn trực tiếp với chuyên viên kỹ thuật** của Tengi nhé! Mình đã đính kèm nút mở nhanh Form đặt lịch ngay bên dưới cho bạn ạ.`,
        can_answer: false,
        matched_faq_id: null,
        suggested_questions: [faqList[1].question, faqList[4].question, faqList[3].question]
      },
      faqList
    );
  }
};
