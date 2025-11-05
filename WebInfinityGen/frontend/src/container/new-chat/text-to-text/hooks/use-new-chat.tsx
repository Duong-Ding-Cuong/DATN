import { useState } from "react";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
};

const useNewChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputCentered, setIsInputCentered] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Gọi API n8n
    const callAPI = async (message: string): Promise<string> => {
        try {
            const response = await fetch(
                "http://localhost:5678/webhook/chat-text",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const responseData = Array.isArray(data) ? data[0] : data;

            // Xử lý các định dạng response khác nhau
            // 1. OpenAI-like: { choices: [{ message: { content } }] }
            if (responseData?.choices?.[0]?.message?.content) {
                return responseData.choices[0].message.content;
            }

            // 2. n8n: { content: { parts: [{ text }] } }
            if (responseData?.content?.parts?.[0]?.text) {
                return responseData.content.parts[0].text;
            }

            // 3. Direct text: { text } hoặc { output }
            if (responseData?.text) return responseData.text;
            if (responseData?.output) return responseData.output;

            // Fallback
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error("API Error:", error);
            throw new Error(
                "⚠️ Không thể kết nối với AI. Vui lòng kiểm tra kết nối và thử lại."
            );
        }
    };

    // Gửi tin nhắn
    const handleSubmit = async () => {
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading) return;

        // Thêm tin nhắn user
        const userMsg: Message = {
            id: Date.now(),
            text: userMessage,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            isUser: true,
        };
        setMessages((prev) => [...prev, userMsg]);

        // Chuyển input xuống đáy
        setIsInputCentered(false);
        setInputValue("");
        setIsLoading(true);

        try {
            const aiText = await callAPI(userMessage);

            // Thêm tin nhắn AI
            const aiMsg: Message = {
                id: Date.now() + 1,
                text: aiText,
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            // Thêm tin nhắn lỗi
            const errorMsg: Message = {
                id: Date.now() + 1,
                text:
                    error instanceof Error
                        ? error.message
                        : "⚠️ Đã xảy ra lỗi không xác định",
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
    };
};

export default useNewChat;
