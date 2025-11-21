import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
};

const API_BASE_URL = "http://localhost:5000/api";

const useNewChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputCentered, setIsInputCentered] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    // Lấy userId từ localStorage khi component mount
    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj._id) {
                    setUserId(userObj._id);
                }
            }
        } catch (error) {
            console.error("Error getting user from localStorage:", error);
        }
    }, []);

    // Load chat history nếu có chatId trong URL
    useEffect(() => {
        const chatIdFromUrl = searchParams.get("chatId");
        if (chatIdFromUrl && userId) {
            loadChatHistory(chatIdFromUrl);
        }
    }, [searchParams, userId]);

    // Lắng nghe event tạo chat mới
    useEffect(() => {
        const handleCreateNewChat = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { path } = customEvent.detail;

            // Chỉ xử lý nếu đang ở trang này
            if (
                window.location.pathname === path &&
                messages.length > 0 &&
                chatId
            ) {
                // Lưu chat hiện tại vào DB (nếu chưa lưu)
                // Chat đã được lưu tự động qua handleSubmit

                // Reset state để tạo chat mới
                setMessages([]);
                setChatId(null);
                setIsInputCentered(true);
                setInputValue("");
            }
        };

        window.addEventListener("createNewChat", handleCreateNewChat);
        return () => {
            window.removeEventListener("createNewChat", handleCreateNewChat);
        };
    }, [messages, chatId]); // Load lại lịch sử chat từ database
    const loadChatHistory = async (historyId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/chat/history/${historyId}`
            );

            if (!response.ok) {
                throw new Error("Failed to load chat history");
            }

            const result = await response.json();
            if (result.success && result.data) {
                const chatData = result.data;
                setChatId(chatData.chatId);

                // Convert messages từ database sang Message type
                const convertedMessages: Message[] = chatData.messages.map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (msg: any, index: number) => ({
                        id: Date.now() + index,
                        text: msg.content,
                        timestamp: new Date(msg.timestamp).toLocaleTimeString(
                            "vi-VN"
                        ),
                        isUser: msg.role === "user",
                    })
                );

                setMessages(convertedMessages);
                setIsInputCentered(false);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Gọi API n8n
    const callAPI = async (message: string): Promise<string> => {
        try {
            const response = await fetch(
                "https://n8n-production-64f1.up.railway.app/webhook-test/chat-text",
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
            if (
                responseData?.content?.parts &&
                Array.isArray(responseData.content.parts)
            ) {
                // Gộp tất cả parts có text lại với nhau
                const allTexts = responseData.content.parts
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((part: any) => part?.text)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((part: any) => part.text)
                    .join("");

                if (allTexts) return allTexts;
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

    // Tạo đoạn chat mới trong database
    const createChatHistory = async (firstMessage: string): Promise<string> => {
        try {
            const newChatId = `chat_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

            const response = await fetch(`${API_BASE_URL}/chat/history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatId: newChatId,
                    userId: userId,
                    title:
                        firstMessage.substring(0, 50) +
                        (firstMessage.length > 50 ? "..." : ""),
                    chatType: "text-to-text",
                    firstMessage: {
                        content: firstMessage,
                        metadata: { type: "text" },
                    },
                }),
            });

            if (!response.ok) {
                console.error("Failed to create chat history");
                return newChatId; // Vẫn trả về chatId để tiếp tục chat
            }

            const data = await response.json();
            console.log("Chat history created:", data);

            // Dispatch event để cập nhật danh sách lịch sử
            window.dispatchEvent(new CustomEvent("chatCreated"));

            return newChatId;
        } catch (error) {
            console.error("Error creating chat history:", error);
            // Trả về chatId tạm để không ảnh hưởng đến UX
            return `chat_${Date.now()}`;
        }
    };

    // Thêm message vào lịch sử chat
    const addMessageToHistory = async (
        role: "user" | "assistant",
        content: string
    ) => {
        if (!chatId || !userId) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/history/${chatId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role,
                        content,
                        metadata: { type: "text" },
                    }),
                }
            );

            if (!response.ok) {
                console.error("Failed to add message to history");
            }
        } catch (error) {
            console.error("Error adding message to history:", error);
        }
    };

    // Gửi tin nhắn
    const handleSubmit = async () => {
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading || !userId) return;

        // Nếu là tin nhắn đầu tiên, tạo chat history mới
        let currentChatId = chatId;
        if (!currentChatId) {
            const newChatId = await createChatHistory(userMessage);
            setChatId(newChatId);
            currentChatId = newChatId;
        }

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

        // Nếu không phải tin nhắn đầu tiên, lưu tin nhắn user vào history
        if (chatId) {
            await addMessageToHistory("user", userMessage);
        }

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

            // Lưu tin nhắn AI vào history - dùng currentChatId thay vì chatId
            if (currentChatId) {
                await fetch(
                    `${API_BASE_URL}/chat/history/${currentChatId}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            role: "assistant",
                            content: aiText,
                            metadata: { type: "text" },
                        }),
                    }
                );
            }
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
