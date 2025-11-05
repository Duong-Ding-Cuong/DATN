import React from "react";
import styled from "styled-components";
import type { Message } from "../hooks/use-create-game";

type Props = {
    messages: Message[];
    isLoading: boolean;
    onReplayGame: (gameCode: {
        html: string;
        css: string;
        javascript: string;
    }) => void;
};

export const GameMessageList: React.FC<Props> = ({
    messages,
    isLoading,
    onReplayGame,
}) => {
    return (
        <>
            {messages.map((message) => (
                <MessageBubble key={message.id} $isUser={message.isUser}>
                    <MessageContent>
                        <MessageText>{message.text}</MessageText>
                        <MessageTime>{message.timestamp}</MessageTime>

                        {/* Show Play button if message contains game code */}
                        {message.gameCode && (
                            <PlayButton
                                onClick={() => onReplayGame(message.gameCode!)}
                            >
                                ▶️ Chơi lại game này
                            </PlayButton>
                        )}
                    </MessageContent>
                </MessageBubble>
            ))}

            {isLoading && (
                <MessageBubble $isUser={false}>
                    <MessageContent>
                        <LoadingDots>
                            <span>●</span>
                            <span>●</span>
                            <span>●</span>
                        </LoadingDots>
                    </MessageContent>
                </MessageBubble>
            )}
        </>
    );
};

const MessageBubble = styled.div<{ $isUser: boolean }>`
    display: flex;
    justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
    margin-bottom: 16px;
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

const MessageContent = styled.div`
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const MessageText = styled.div`
    background: #303030;
    color: #ffffff;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
`;

const MessageTime = styled.div`
    font-size: 11px;
    color: #888888;
    padding: 0 4px;
`;

const PlayButton = styled.button`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
`;

const LoadingDots = styled.div`
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: #303030;
    border-radius: 12px;

    span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff6f5c;
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }
        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }

    @keyframes bounce {
        0%,
        80%,
        100% {
            transform: scale(0);
        }
        40% {
            transform: scale(1);
        }
    }
`;
