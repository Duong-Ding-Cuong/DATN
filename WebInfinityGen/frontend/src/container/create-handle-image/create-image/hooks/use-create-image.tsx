import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    inputImage?: string;
    image?: string;
};

type AIResponse = {
    text?: string;
    image?: string;
};

export const useCreateImage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputCentered, setIsInputCentered] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const location = useLocation();

    // Lắng nghe event tạo chat mới
    useEffect(() => {
        const handleCreateNewChat = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { path } = customEvent.detail;

            if (location.pathname === path && messages.length > 0) {
                setMessages([]);
                setInputValue("");
                setIsInputCentered(true);
                setUploadedImage(null);
            }
        };

        window.addEventListener("createNewChat", handleCreateNewChat);
        return () => {
            window.removeEventListener("createNewChat", handleCreateNewChat);
        };
    }, [messages, location.pathname]);

    // 📤 Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix để lấy raw base64
                const base64 = result.split(",")[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 🖼️ Handle image upload
    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh");
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            const dataUrl = `data:${file.type};base64,${base64}`;
            setUploadedImage(dataUrl);
        } catch (error) {
            console.error("❌ Error uploading image:", error);
            alert("Không thể tải ảnh lên");
        }
    };

    // 🗑️ Remove uploaded image
    const removeUploadedImage = () => {
        setUploadedImage(null);
        console.log("🗑️ Uploaded image removed");
    };

    // ✅ Extract base64 image từ text (markdown code block hoặc data URL)
    const extractImageFromText = (
        text: string
    ): { cleanText: string; imageBase64?: string } => {
        let imageBase64: string | undefined = undefined;
        let cleanText = text;

        // Pattern 1: data:image/...;base64,xxx trong markdown code block
        const dataUrlPattern = /(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g;
        const dataUrlMatch = text.match(dataUrlPattern);

        if (dataUrlMatch && dataUrlMatch[0]) {
            imageBase64 = dataUrlMatch[0];
            // Remove code block và data URL
            cleanText = text
                .replace(/```[\s\S]*?```/g, "") // Remove code blocks
                .replace(dataUrlPattern, "") // Remove data URL
                .trim();
        }

        // Pattern 2: Base64 string thuần (không có data:image prefix)
        if (!imageBase64) {
            const base64Pattern = /([A-Za-z0-9+/]{100,}={0,2})/;
            const base64Match = text.match(base64Pattern);

            if (base64Match && base64Match[1]) {
                const rawBase64 = base64Match[1].replace(/\s+/g, "");

                // Auto-detect MIME type
                let mimeType = "image/jpeg";
                if (rawBase64.startsWith("/9j/")) {
                    mimeType = "image/jpeg";
                } else if (rawBase64.startsWith("iVBORw0KGgo")) {
                    mimeType = "image/png";
                } else if (rawBase64.startsWith("R0lGOD")) {
                    mimeType = "image/gif";
                } else if (rawBase64.startsWith("UklGR")) {
                    mimeType = "image/webp";
                }

                imageBase64 = `data:${mimeType};base64,${rawBase64}`;
                cleanText = text.replace(base64Pattern, "").trim();
            }
        }

        return { cleanText, imageBase64 };
    };

    // 🎨 Convert base64 string thành data URL
    const convertBase64ToDataUrl = (
        base64: string,
        mimeType: string = "image/png"
    ): string => {
        // Nếu đã có prefix data:image thì return luôn
        if (base64.startsWith("data:image")) {
            return base64;
        }

        // Nếu là URL thông thường
        if (base64.startsWith("http://") || base64.startsWith("https://")) {
            return base64;
        }

        // Nếu là raw base64, thêm prefix
        return `data:${mimeType};base64,${base64}`;
    };

    // 🚀 CALL n8n API để tạo ảnh
    const callAPI = async (
        prompt: string,
        inputImage?: string
    ): Promise<AIResponse> => {
        try {
            // Chuẩn bị payload
            type Payload = {
                prompt: string;
                inputImage?: {
                    data: string;
                    mimeType: string;
                };
            };

            const payload: Payload = {
                prompt: prompt,
            };

            // Nếu có ảnh input (image-to-image), thêm vào payload
            if (inputImage) {
                // Extract base64 và mime type từ data URL
                const [mimeTypePart, base64Data] = inputImage.split(",");
                const mimeType =
                    mimeTypePart.match(/:(.*?);/)?.[1] || "image/png";

                payload.inputImage = {
                    data: base64Data,
                    mimeType: mimeType,
                };
            }

            // Gọi n8n webhook
            const response = await fetch(
                "http://localhost:5678/webhook-test/create-image",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ n8n API Error:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                });

                if (response.status === 404) {
                    throw new Error(
                        "⚠️ n8n webhook không tồn tại. Vui lòng kiểm tra:\n" +
                            "1. n8n đã chạy tại http://localhost:5678\n" +
                            "2. Webhook path: /webhook/create-image\n" +
                            "3. Workflow đã được activate"
                    );
                } else if (response.status === 400) {
                    throw new Error(
                        "⚠️ Request không hợp lệ. Vui lòng kiểm tra lại prompt hoặc ảnh."
                    );
                } else if (response.status === 500) {
                    throw new Error(
                        "⚠️ Lỗi server. Vui lòng kiểm tra n8n workflow."
                    );
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const result: AIResponse = {};
            let textContent = "";
            let imageUrl: string | null = null;

            // ===================== PARSE RESPONSE =====================

            // Xử lý response từ n8n
            const responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;

            // Priority 1: Gemini content.parts format
            if (
                responseData?.content?.parts &&
                Array.isArray(responseData.content.parts)
            ) {
                const parts = responseData.content.parts;

                for (const part of parts) {
                    // Extract text
                    if (part.text && typeof part.text === "string") {
                        console.log("✅ Found Gemini text in parts");
                        const { cleanText, imageBase64 } = extractImageFromText(
                            part.text
                        );

                        if (imageBase64) {
                            imageUrl = imageBase64;
                        }

                        if (cleanText && cleanText.length > 0) {
                            textContent = cleanText;
                        }
                    }

                    // Extract inline_data image
                    if (
                        !imageUrl &&
                        part.inline_data?.data &&
                        part.inline_data?.mime_type?.startsWith("image/")
                    ) {
                        const inlineMimeType = part.inline_data.mime_type;
                        imageUrl = `data:${inlineMimeType};base64,${part.inline_data.data}`;
                    }
                }
            }

            // Priority 2: candidates format (Gemini response structure)
            if (
                !imageUrl &&
                responseData?.candidates?.[0]?.content?.parts &&
                Array.isArray(responseData.candidates[0].content.parts)
            ) {
                const parts = responseData.candidates[0].content.parts;

                for (const part of parts) {
                    // Extract text
                    if (part.text && typeof part.text === "string") {
                        const { cleanText, imageBase64 } = extractImageFromText(
                            part.text
                        );

                        if (imageBase64) {
                            imageUrl = imageBase64;
                        }

                        if (cleanText && cleanText.length > 0) {
                            textContent = cleanText;
                        }
                    }

                    // Extract inline_data image
                    if (
                        !imageUrl &&
                        part.inline_data?.data &&
                        part.inline_data?.mime_type?.startsWith("image/")
                    ) {
                        const inlineMimeType = part.inline_data.mime_type;
                        imageUrl = `data:${inlineMimeType};base64,${part.inline_data.data}`;
                    }

                    // File URI (Google Storage)
                    if (
                        !imageUrl &&
                        part.fileData?.fileUri &&
                        part.fileData?.mimeType?.startsWith("image/")
                    ) {
                        imageUrl = part.fileData.fileUri;
                    }
                }
            }

            // Priority 3: Direct image field
            if (
                !imageUrl &&
                responseData?.image &&
                typeof responseData.image === "string"
            ) {
                imageUrl = convertBase64ToDataUrl(responseData.image);
            }

            // Priority 4: Data field
            if (
                !imageUrl &&
                responseData?.data &&
                typeof responseData.data === "string"
            ) {
                imageUrl = convertBase64ToDataUrl(responseData.data);
            }

            // Priority 5: Output field (có thể là JSON string)
            if (
                !imageUrl &&
                responseData?.output &&
                typeof responseData.output === "string"
            ) {
                try {
                    const parsedOutput = JSON.parse(responseData.output);

                    if (parsedOutput.image) {
                        imageUrl = convertBase64ToDataUrl(parsedOutput.image);
                    }
                    if (parsedOutput.text) {
                        const { cleanText, imageBase64 } = extractImageFromText(
                            parsedOutput.text
                        );
                        if (imageBase64) imageUrl = imageBase64;
                        if (cleanText) textContent = cleanText;
                    }
                } catch (err) {
                    console.log(
                        "'output' is not JSON, trying to extract image",
                        err
                    );
                    const { cleanText, imageBase64 } = extractImageFromText(
                        responseData.output
                    );
                    if (imageBase64) imageUrl = imageBase64;
                    if (cleanText) textContent = cleanText;
                }
            }

            // Extract text content
            if (!textContent && responseData?.text) {
                const { cleanText, imageBase64 } = extractImageFromText(
                    responseData.text
                );
                if (imageBase64) imageUrl = imageBase64;
                if (cleanText) textContent = cleanText;
            } else if (!textContent && responseData?.message) {
                textContent = responseData.message;
            } else if (!textContent && responseData?.description) {
                textContent = responseData.description;
            }

            // Check for blocked content
            if (responseData?.candidates?.[0]?.finishReason === "SAFETY") {
                console.warn("⚠️ Content was blocked by safety filters");
                textContent = "⚠️ Nội dung bị chặn bởi bộ lọc an toàn.";
            }

            // Fallback text
            if (!textContent) {
                textContent = "✓ Đã tạo ảnh thành công";
            }

            textContent = textContent.trim();

            // =====================KẾT QUẢ =====================

            // Remove markdown image syntax nếu có
            result.text =
                textContent.replace(/!\[.*?\]\(.*?\)/g, "").trim() ||
                "✓ Đã tạo ảnh thành công";

            if (imageUrl) {
                result.image = imageUrl;
                console.log(" Final generated image:", {
                    imageLength: imageUrl.length,
                    imagePreview: imageUrl.substring(0, 100),
                });
            } else {
                console.warn("⚠️ No image found in response");
            }

            console.log("Final result:", {
                textPreview: result.text.substring(0, 100),
                hasImage: !!result.image,
            });

            return result;
        } catch (error) {
            console.error("💥 API Error:", error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error("⚠️ Không thể tạo ảnh. Vui lòng thử lại.");
        }
    };

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async () => {
        const userMessage = inputValue.trim();

        // Validate input - Phải có prompt
        if (!userMessage || isLoading) {
            if (!userMessage) {
                alert("⚠️ Vui lòng nhập mô tả ảnh bạn muốn tạo");
            }
            return;
        }

        console.log("Submitting:", {
            prompt: userMessage,
            hasInputImage: !!uploadedImage,
        });

        // Create user message
        const userMsg: Message = {
            id: Date.now(),
            text: userMessage,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            isUser: true,
            inputImage: uploadedImage || undefined,
        };

        // Add user message to chat
        setMessages((prev) => [...prev, userMsg]);

        // Clear input
        setInputValue("");
        setIsInputCentered(false);
        setIsLoading(true);

        try {
            // Call n8n API to create image
            const aiResponse = await callAPI(
                userMessage,
                uploadedImage || undefined
            );

            // Create AI response message
            const aiMsg: Message = {
                id: Date.now() + 1,
                text: aiResponse.text ?? "✓ Đã tạo ảnh thành công",
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
                image: aiResponse.image,
            };

            console.log("AI message:", {
                textPreview: aiMsg.text.substring(0, 100),
                hasImage: !!aiMsg.image,
            });

            // Add AI message to chat
            setMessages((prev) => [...prev, aiMsg]);

            // Clear uploaded image after processing
            setUploadedImage(null);

            console.log("Image created successfully");
        } catch (error) {
            console.error("❌ Submit Error:", error);

            // Create error message
            const errMsg: Message = {
                id: Date.now() + 1,
                text:
                    error instanceof Error
                        ? error.message
                        : "⚠️ Đã xảy ra lỗi không xác định khi tạo ảnh",
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
            };

            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // =====================CLEAR CHAT =====================
    const clearChat = () => {
        setMessages([]);
        setInputValue("");
        setUploadedImage(null);
        setIsInputCentered(true);
        console.log("🔄 Chat cleared");
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
        uploadedImage,
        handleImageUpload,
        removeUploadedImage,
        clearChat,
    };
};
