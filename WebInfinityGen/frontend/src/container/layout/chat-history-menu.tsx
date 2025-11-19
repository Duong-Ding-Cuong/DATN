import React, { useEffect, useState } from "react";
import { Menu, Spin, message } from "antd";
import {
    HistoryOutlined,
    DeleteOutlined,
    MessageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

interface ChatHistoryItem {
    _id: string;
    chatId: string;
    title: string;
    chatType: string;
    createdAt: string;
    updatedAt: string;
}

const API_BASE_URL = "http://localhost:5000/api";

export const ChatHistoryMenu: React.FC = () => {
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    // lấy userId
    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj._id) setUserId(userObj._id);
            }
        } catch {
            // Ignore error
        }
    }, []);

    // fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE_URL}/chat/history/user/${userId}?limit=50`
                );
                const result = await res.json();
                if (result.success) setChatHistory(result.data);
            } catch {
                message.error("Không thể tải lịch sử chat");
            }
            setLoading(false);
        };

        if (userId) fetchHistory();
    }, [userId]);

    // Lắng nghe event khi tạo chat mới
    useEffect(() => {
        const handleRefreshHistory = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE_URL}/chat/history/user/${userId}?limit=50`
                );
                const result = await res.json();
                if (result.success) setChatHistory(result.data);
            } catch {
                // Silent fail
            }
            setLoading(false);
        };

        // Chỉ lắng nghe event tạo chat mới
        window.addEventListener("chatCreated", handleRefreshHistory);

        return () => {
            window.removeEventListener("chatCreated", handleRefreshHistory);
        };
    }, [userId]);

    const refreshChatHistory = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/chat/history/user/${userId}?limit=50`
            );
            const result = await res.json();
            if (result.success) setChatHistory(result.data);
        } catch {
            message.error("Không thể tải lịch sử chat");
        }
        setLoading(false);
    };

    const handleChatClick = (chatId: string, chatType: string) => {
        const routeMap: { [key: string]: string } = {
            "text-to-text": "/chat/new",
            "file-to-text": "/chat/file-to-text",
            "create-image": "/chat/create-image",
            "handle-image": "/chat/handle-image",
            "increase-resolution": "/chat/increase-image-resolution",
            "background-separation": "/chat/background-separation",
            "image-compression": "/chat/image-compression",
            "create-game": "/chat/create-game",
        };
        navigate(`${routeMap[chatType] || "/chat/new"}?chatId=${chatId}`);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE_URL}/chat/history/${chatId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            message.success("Đã xóa đoạn chat");
            refreshChatHistory();
        } catch {
            message.error("Không thể xóa đoạn chat");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Hôm nay";
        if (days === 1) return "Hôm qua";
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    const getChatTypeLabel = (chatType: string) => {
        const labels: { [key: string]: string } = {
            "text-to-text": "Chat văn bản",
            "file-to-text": "Phân tích file",
            "create-image": "Tạo ảnh",
            "handle-image": "Xử lý ảnh",
            "increase-resolution": "Làm nét ảnh",
            "background-separation": "Tách nền",
            "image-compression": "Nén ảnh",
            "create-game": "Tạo game",
        };
        return labels[chatType] || chatType;
    };

    if (loading) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "30px 20px",
                    color: "#666",
                }}
            >
                <Spin size="small" />
                <div style={{ marginTop: "12px", fontSize: "12px" }}>
                    Đang tải...
                </div>
            </div>
        );
    }

    if (chatHistory.length === 0) {
        return (
            <div
                style={{
                    padding: "30px 20px",
                    textAlign: "center",
                    color: "#666",
                }}
            >
                <MessageOutlined
                    style={{
                        fontSize: 32,
                        marginBottom: 12,
                        opacity: 0.5,
                    }}
                />
                <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    Chưa có lịch sử chat
                </div>
                <div
                    style={{
                        fontSize: "11px",
                        marginTop: "4px",
                        opacity: 0.7,
                    }}
                >
                    Bắt đầu chat để lưu lịch sử
                </div>
            </div>
        );
    }

    const menuItems = chatHistory.map((chat) => ({
        key: chat.chatId,
        icon: (
            <HistoryOutlined
                style={{
                    fontSize: "16px",
                    color: "#c6613f",
                }}
            />
        ),
        label: (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    gap: "8px",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chat-item-title">{chat.title}</div>

                    <div className="chat-item-info">
                        <span>{getChatTypeLabel(chat.chatType)}</span>
                        <span>•</span>
                        <span>{formatDate(chat.updatedAt)}</span>
                    </div>
                </div>

                <DeleteOutlined
                    onClick={(e) => handleDeleteChat(e, chat.chatId)}
                    style={{
                        color: "#666",
                        fontSize: "14px",
                        padding: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ff4d4f";
                        e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#666";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                />
            </div>
        ),
        onClick: () => handleChatClick(chat.chatId, chat.chatType),
    }));

    return (
        <div
            style={{
                marginTop: "20px",
                borderTop: "1px solid #2a2a2a",
                paddingTop: "12px",
            }}
        >
            <div
                style={{
                    padding: "8px 24px",
                    color: "#888",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <HistoryOutlined style={{ fontSize: "12px" }} />
                <span>Lịch sử chat</span>
            </div>

            <div className="chat-history-scroll">
                <Menu
                    mode="inline"
                    items={menuItems}
                    style={{
                        background: "transparent",
                        color: "#fff",
                        border: "none",
                    }}
                />
            </div>

            {/* CSS FIX FULL */}
            <style>{`
                .chat-history-scroll {
                    max-height: 400px;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                .chat-history-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-history-scroll::-webkit-scrollbar-track {
                    background: #181818;
                }
                .chat-history-scroll::-webkit-scrollbar-thumb {
                    background: #3a3a3a;
                    border-radius: 3px;
                }
                .chat-history-scroll::-webkit-scrollbar-thumb:hover {
                    background: #4a4a4a;
                }

                .ant-menu {
                    background: transparent !important;
                    border: none !important;
                }

                .ant-menu-item {
                    padding: 10px 14px !important;
                    margin: 4px 8px !important;
                    border-radius: 8px !important;
                    height: auto !important;
                    line-height: normal !important;
                    white-space: normal !important;
                }

                .ant-menu-item:hover {
                    background: #252525 !important;
                }

                .ant-menu-item-selected {
                    background: #2a2a2a !important;
                    border-radius: 8px !important;
                }

                .chat-item-title {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 13px;
                    font-weight: 500;
                    color: #fff;
                    margin-bottom: 4px;
                    display: block;
                }

                .chat-item-info {
                    opacity: 0.8;
                    font-size: 11px;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    color: #888;
                }
            `}</style>
        </div>
    );
};
