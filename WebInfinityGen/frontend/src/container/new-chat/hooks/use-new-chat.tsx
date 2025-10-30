import { useState } from "react";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    image?: string; // Thêm field cho ảnh
};

type SelectedImage = {
    file: File;
    preview: string;
};

const useNewChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputCentered, setIsInputCentered] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
        null
    );

    // Hàm chuyển đổi file thành base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Loại bỏ phần "data:image/...;base64," để chỉ lấy base64 string
                const base64Data = base64String.split(",")[1];
                resolve(base64Data);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Hàm chuyển base64 (không có tiền tố) thành URL ảnh cho <img src>
    const base64ToImageUrl = (base64: string): string => {
        // Kiểm tra nếu đã có prefix data:image
        if (base64.startsWith("data:image/")) {
            return base64;
        }
        // Kiểm tra nếu là URL thông thường
        if (base64.startsWith("http://") || base64.startsWith("https://")) {
            return base64;
        }
        // Tự động detect mime type từ base64 string
        let mimeType = "image/jpeg";
        if (base64.startsWith("/9j/")) {
            mimeType = "image/jpeg";
        } else if (base64.startsWith("iVBORw0KGgo")) {
            mimeType = "image/png";
        } else if (base64.startsWith("R0lGOD")) {
            mimeType = "image/gif";
        } else if (base64.startsWith("UklGR")) {
            mimeType = "image/webp";
        }
        return `data:${mimeType};base64,${base64}`;
    };

    // Hàm gọi API n8n
    const callLocalAPI = async (
        message: string,
        imageBase64?: string
    ): Promise<{ text?: string; image?: string }> => {
        try {
            const payload: { message: string; image?: string } = { message };
            if (imageBase64) {
                payload.image = imageBase64;
            }
            const response = await fetch(
                "http://localhost:5678/webhook-test/ba995b5f-52a0-4505-9584-0d8737cbe3ce",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );
            const data = await response.json();
            const responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;
            // Common OpenAI-like shape: { choices: [{ message: { content, images } }] }
            if (
                responseData.choices &&
                Array.isArray(responseData.choices) &&
                responseData.choices.length > 0
            ) {
                const choice = responseData.choices[0];
                let text = "";
                let image = undefined;
                if (choice.message) {
                    text = choice.message.content || "";
                    if (
                        Array.isArray(choice.message.images) &&
                        choice.message.images.length > 0
                    ) {
                        const firstImg = choice.message.images[0];
                        // Support different image shapes
                        image =
                            firstImg.image_url?.url || firstImg.url || firstImg;
                    }
                }
                if (text || image) return { text, image };
            }

            // n8n / custom webhook shape observed in network: { content: { parts: [{ text: '...' }] }, role }
            const extractFromContentParts = (
                obj: unknown
            ): string | undefined => {
                if (!obj || typeof obj !== "object") return undefined;
                const record = obj as Record<string, unknown>;
                const c = (record.content ?? record) as
                    | Record<string, unknown>
                    | undefined;
                if (!c) return undefined;
                const parts = c.parts as unknown;
                if (Array.isArray(parts) && parts.length > 0) {
                    const part = parts[0];
                    if (typeof part === "string") return part;
                    if (part && typeof part === "object") {
                        const p = part as Record<string, unknown>;
                        if (typeof p.text === "string") return p.text;
                    }
                }
                return undefined;
            };

            // try extracting from responseData or raw data array
            const textFromContent =
                extractFromContentParts(responseData) ||
                (Array.isArray(data) &&
                    data.length > 0 &&
                    extractFromContentParts(data[0]));
            if (textFromContent) return { text: textFromContent };

            // Fallback: Nếu response là mảng và có output, lấy output làm text
            if (Array.isArray(data) && data.length > 0 && data[0].output) {
                return { text: data[0].output };
            }
            if (data.text || data.image)
                return { text: data.text, image: data.image };
            return { text: "⚠️ Không có phản hồi từ AI." };
        } catch (error) {
            return { text: handleApiError(error) };
        }
    };

    // Hàm xử lý lỗi API
    const handleApiError = (error: unknown): string => {
        console.error("Lỗi khi gọi API:", error);
        if (error instanceof Error && error.message.startsWith("⚠️")) {
            return error.message;
        }
        return "⚠️ Không thể kết nối với AI. Vui lòng:\n• Kiểm tra kết nối internet\n• Thử lại sau vài phút\n• Liên hệ admin nếu vấn đề vẫn tiếp diễn";
    };

    // Hàm xử lý khi user submit tin nhắn
    const handleSubmit = async () => {
        if ((!inputValue.trim() && !selectedImage) || isLoading) return;

        const userMessage = inputValue.trim();
        const hasImage = selectedImage !== null;

        // Tạo message của user
        const userMessageObj: Message = {
            id: Date.now(),
            text: userMessage,
            timestamp: new Date().toLocaleTimeString(),
            isUser: true,
            image: hasImage ? selectedImage?.preview : undefined,
        };

        setMessages((prev) => [...prev, userMessageObj]);

        setTimeout(() => {
            setIsInputCentered(false);
        }, 100);

        const imageToProcess = selectedImage;

        setInputValue("");
        setSelectedImage(null);
        const fileInput = document.querySelector(
            'input[type="file"][accept^="image/"]'
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        setIsLoading(true);

        try {
            let aiResponse: { text?: string; image?: string };

            if (hasImage && imageToProcess) {
                const imageBase64 = await fileToBase64(imageToProcess.file);
                aiResponse = await callLocalAPI(
                    userMessage || "Hãy mô tả chi tiết về hình ảnh này.",
                    imageBase64
                );
            } else {
                aiResponse = await callLocalAPI(userMessage);
            }

            const aiMessageObj: Message = {
                id: Date.now() + 1,
                text: aiResponse.text || "",
                timestamp: new Date().toLocaleTimeString(),
                isUser: false,
                image: aiResponse.image,
            };
            setMessages((prev) => [...prev, aiMessageObj]);
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                text:
                    error instanceof Error
                        ? error.message
                        : "Đã xảy ra lỗi không xác định",
                timestamp: new Date().toLocaleTimeString(),
                isUser: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Trả về messages đã xử lý image thành URL hợp lệ cho <img src>
    const processedMessages = messages.map((msg) => {
        if (
            msg.image &&
            !msg.image.startsWith("data:image/") &&
            !msg.image.startsWith("http")
        ) {
            return { ...msg, image: base64ToImageUrl(msg.image) };
        }
        return msg;
    });

    return {
        messages: processedMessages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
        selectedImage,
        setSelectedImage,
        setMessages,
    };
};

export default useNewChat;
