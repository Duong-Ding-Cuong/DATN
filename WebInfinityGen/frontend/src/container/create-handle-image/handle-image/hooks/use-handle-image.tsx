import { useState } from "react";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    image?: string;
};

type SelectedImage = {
    file: File;
    preview: string;
};

const useHandleImage = () => {
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
                const base64Data = base64String.split(",")[1];
                resolve(base64Data);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Hàm chuyển base64 thành URL ảnh
    const base64ToImageUrl = (base64: string): string => {
        if (base64.startsWith("data:image/")) {
            return base64;
        }
        if (base64.startsWith("http://") || base64.startsWith("https://")) {
            return base64;
        }

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
                "http://localhost:5678/webhook/handle-image",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            console.log("📥 Raw API response:", data);

            let responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;

            // ===================== PARSE JSON STRING IF NEEDED =====================

            // Nếu field "output" là JSON string, parse nó
            if (
                responseData?.output &&
                typeof responseData.output === "string"
            ) {
                try {
                    const parsedOutput = JSON.parse(responseData.output);
                    console.log(
                        "✅ Parsed JSON from 'output' field:",
                        parsedOutput
                    );
                    responseData = parsedOutput;
                } catch {
                    console.log(
                        " 'output' is not JSON, treating as plain text"
                    );
                }
            }

            let textContent: string | undefined = undefined;
            let imageUrl: string | undefined = undefined;

            // ===================== EXTRACT TEXT & IMAGE =====================

            // Priority 1: Direct fields "text" and "image" (after JSON parse)
            if (responseData?.text && typeof responseData.text === "string") {
                console.log("✅ Found 'text' field");
                textContent = responseData.text;
            }

            if (responseData?.image && typeof responseData.image === "string") {
                console.log("✅ Found 'image' field");
                imageUrl = responseData.image;
            }

            // Priority 2: Field "message"
            if (
                !textContent &&
                responseData?.message &&
                typeof responseData.message === "string"
            ) {
                console.log("✅ Found 'message' field");
                textContent = responseData.message;
            }

            // Priority 3: Field "data"
            if (
                !textContent &&
                responseData?.data &&
                typeof responseData.data === "string"
            ) {
                console.log("✅ Found 'data' field");
                textContent = responseData.data;
            }

            // Priority 4: OpenAI-like format
            if (
                !textContent &&
                responseData.choices &&
                Array.isArray(responseData.choices) &&
                responseData.choices.length > 0
            ) {
                const choice = responseData.choices[0];
                if (choice.message) {
                    textContent = choice.message.content || "";

                    if (
                        !imageUrl &&
                        Array.isArray(choice.message.images) &&
                        choice.message.images.length > 0
                    ) {
                        const firstImg = choice.message.images[0];
                        imageUrl =
                            firstImg.image_url?.url || firstImg.url || firstImg;
                    }
                }
            }

            // Priority 5: Content parts format
            if (!textContent && responseData?.content?.parts) {
                const parts = responseData.content.parts;
                if (Array.isArray(parts) && parts.length > 0) {
                    const part = parts[0];
                    textContent = typeof part === "string" ? part : part.text;
                }
            }

            // ===================== VALIDATION =====================

            if (!textContent && !imageUrl) {
                console.warn("⚠️ No text or image found in response");
                return { text: "⚠️ Không có phản hồi từ AI." };
            }

            console.log("✅ Parsed response:", {
                hasText: !!textContent,
                textPreview: textContent?.substring(0, 100),
                hasImage: !!imageUrl,
                imagePreview: imageUrl?.substring(0, 100),
            });

            return {
                text: textContent || "",
                image: imageUrl,
            };
        } catch (error) {
            console.error("💥 API Error:", error);
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

            console.log("📦 AI message object:", {
                hasText: !!aiMessageObj.text,
                hasImage: !!aiMessageObj.image,
                imagePreview: aiMessageObj.image?.substring(0, 100),
            });

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

    // Trả về messages đã xử lý image thành URL hợp lệ
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

export default useHandleImage;
