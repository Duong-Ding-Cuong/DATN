import styled from "styled-components";
import { DownloadOutlined } from "@ant-design/icons";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    image?: string;
    fileUrl?: string;
    fileName?: string;
};

type MessageListProps = {
    messages: Message[];
    isLoading?: boolean;
    loadingText?: string;
};

export const MessageList = ({
    messages,
    isLoading = false,
    loadingText = "AI đang trả lời...",
}: MessageListProps) => {
    // Download image function
    const handleDownloadImage = async (imageUrl: string, messageId: number) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `image_${messageId}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
        }
    };

    return (
        <>
            {/* Render tin nhắn trên khung chat */}
            {messages.map((msg) => (
                <MessageItem key={msg.id} $isUser={msg.isUser}>
                    <MessageBubble $isUser={msg.isUser}>
                        {/* 1. Text */}
                        {msg.text && <MessageText>{msg.text}</MessageText>}

                        {/* 2. Hình ảnh */}
                        {msg.image && (
                            <ImageContainer>
                                <MessageImage
                                    src={msg.image}
                                    alt="Message attachment"
                                />
                                <DownloadButton
                                    onClick={() =>
                                        handleDownloadImage(msg.image!, msg.id)
                                    }
                                    title="Tải ảnh xuống"
                                >
                                    <DownloadOutlined /> Tải xuống
                                </DownloadButton>
                            </ImageContainer>
                        )}

                        {/* 3. File download */}
                        {msg.fileUrl && (
                            <FileDownload
                                href={msg.fileUrl}
                                download={msg.fileName ?? "file"}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DownloadOutlined />{" "}
                                {msg.fileName ?? "Tải xuống file"}
                            </FileDownload>
                        )}

                        {/* 4. Timestamp */}
                        <Timestamp>{msg.timestamp}</Timestamp>
                    </MessageBubble>
                </MessageItem>
            ))}

            {/* Loading indicator */}
            {isLoading && <LoadingText>{loadingText}</LoadingText>}
        </>
    );
};

const MessageItem = styled.div<{ $isUser: boolean }>`
    margin-bottom: 16px;
    text-align: ${({ $isUser }) => ($isUser ? "right" : "left")};
    animation: fadeIn 0.3s ease-in;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
    display: inline-block;
    padding: 12px 16px;
    border-radius: 12px;
    background-color: ${({ $isUser }) => ($isUser ? "#303030" : "transparent")};
    color: #fff;
    max-width: 70%;
    word-wrap: break-word;
    box-shadow: ${({ $isUser }) =>
        $isUser ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none"};
    transition: transform 0.2s;

    &:hover {
        transform: ${({ $isUser }) => ($isUser ? "scale(1.02)" : "none")};
    }
`;

const MessageText = styled.p`
    margin: 0;
    line-height: 1.5;
    white-space: pre-wrap;
`;

const ImageContainer = styled.div`
    position: relative;
    display: inline-block;
    margin-top: 8px;
`;

const MessageImage = styled.img`
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    cursor: pointer;
    object-fit: contain;
    display: block;

    &:hover {
        opacity: 0.9;
    }
`;

const DownloadButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 16px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #fff;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    justify-content: center;

    &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const FileDownload = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background-color 0.2s;

    &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: #fff;
    }
`;

const Timestamp = styled.span`
    display: block;
    margin-top: 6px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
`;

const LoadingText = styled.div`
    color: #888;
    font-style: italic;
    text-align: center;
    padding: 12px;
    animation: pulse 1.5s ease-in-out infinite;

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }
`;
