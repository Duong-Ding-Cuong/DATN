import styled, { keyframes, css } from "styled-components";

export const RootContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #212121;
    overflow: hidden;
`;

export const DragOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(37, 99, 235, 0.1);
    border: 2px dashed #2563eb;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
`;

export const DragText = styled.p`
    color: #2563eb;
    font-size: 18px;
    font-weight: bold;
`;

export const MessagesContainer = styled.div<{ $isInputCentered: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 140px;
    overflow-y: auto;
    padding: 20px;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 0 : 1)};
    transition: opacity 0.5s ease-in-out;
    scrollbar-width: none;
    ms-overflow-style: none;
    &.messages-container::-webkit-scrollbar {
        display: none;
    }
`;

export const MessagesInner = styled.div`
    max-width: 768px;
    margin: 0 auto;
`;

const slideUp = keyframes`
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Nếu là message cuối cùng (AI vừa trả lời), không delay animation để hiện ra ngay
export const MessageRow = styled.div<{
    $isUser: boolean;
    $index: number;
    $isLast?: boolean;
}>`
    display: flex;
    justify-content: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
    margin-bottom: 16px;
    opacity: 0;
    transform: translateY(20px);
    animation: ${slideUp} 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)
        ${({ $isUser, $isLast, $index }) =>
            $isUser || $isLast ? "0s" : `${$index * 0.11}s`}
        forwards;
`;

export const MessageBubble = styled.div<{ $isUser: boolean }>`
    background-color: ${({ $isUser }) => ($isUser ? "black" : "")};
    color: white;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-right-radius: ${({ $isUser }) => ($isUser ? "4px" : "16px")};
    border-bottom-left-radius: ${({ $isUser }) => ($isUser ? "16px" : "4px")};
    max-width: 100%;
    word-wrap: break-word;
    line-height: 28px;
    font-size: 1rem;
`;

export const Timestamp = styled.p`
    margin: 4px 0 0 0;
    font-size: 12px;
    opacity: 0.75;
`;

export const LoadingRow = styled.div`
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
`;

export const LoadingBubble = styled.div`
    background-color: #374151;
    color: white;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    max-width: 70%;
`;

export const LoadingDots = styled.div`
    display: flex;
    gap: 4px;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

export const LoadingDot = styled.div<{ delay?: string }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #9ca3af;
    animation: ${bounce} 1.4s infinite ease-in-out both;
    ${({ delay }) =>
        delay &&
        css`
            animation-delay: ${delay};
        `}
`;

export const LoadingText = styled.span`
    font-size: 12px;
    opacity: 0.7;
`;

export const InputContainer = styled.div<{ $isInputCentered: boolean }>`
    position: absolute;
    left: 50%;
    width: 100%;
    max-width: 768px;
    padding: 0 24px;
    transform: translateX(-50%)
        translateY(
            ${({ $isInputCentered }) => ($isInputCentered ? "-50%" : "0")}
        );
    top: ${({ $isInputCentered }) => ($isInputCentered ? "50%" : "auto")};
    bottom: ${({ $isInputCentered }) => ($isInputCentered ? "auto" : "20px")};
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
`;

export const WelcomeMessage = styled.div<{ $isInputCentered: boolean }>`
    text-align: center;
    margin-bottom: 32px;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 1 : 0)};
    transform: translateY(
        ${({ $isInputCentered }) => ($isInputCentered ? "0" : "-20px")}
    );
    transition: all 0.5s ease-in-out;
    pointer-events: ${({ $isInputCentered }) =>
        $isInputCentered ? "auto" : "none"};
`;

export const ImagePreviewBox = styled.div`
    margin-bottom: 16px;
    padding: 12px;
    background-color: #2a2a2a;
    border-radius: 12px;
    border: 1px solid #404040;
`;

export const ImagePreviewRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const ImagePreview = styled.img`
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
`;

export const ImagePreviewInfo = styled.div`
    flex: 1;
    color: white;
`;

export const ImagePreviewName = styled.p`
    margin: 0;
    font-size: 14px;
    font-weight: 500;
`;

export const ImagePreviewDesc = styled.p`
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #9ca3af;
`;

export const RemoveImageButton = styled.button`
    padding: 6px;
    border-radius: 6px;
    border: none;
    background-color: #ef4444;
    color: white;
    cursor: pointer;
`;

export const InputForm = styled.div<{ $isInputCentered: boolean }>`
    display: flex;
    align-items: flex-end;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 16px;
    box-shadow: ${({ $isInputCentered }) =>
        $isInputCentered
            ? "0 10px 25px rgba(0,0,0,0.3)"
            : "0 4px 12px rgba(0,0,0,0.2)"};
    transition: box-shadow 0.3s ease;
`;

export const FileButton = styled.button`
    margin: 8px;
    padding: 8px;
    border-radius: 50%;
    border: none;
    background-color: #6b7280;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 1;
    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    &:hover:not(:disabled) {
        background-color: #4b5563;
    }
`;

export const StyledTextarea = styled.textarea<{ $isLoading: boolean }>`
    flex: 1;
    padding: 12px 16px;
    background-color: transparent;
    border: none;
    outline: none;
    resize: none;
    color: ${({ $isLoading }) => ($isLoading ? "#9ca3af" : "white")};
    font-size: 16px;
    font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica,
        Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
    max-height: 120px;
    min-height: 48px;
    scrollbar-width: none;
`;

export const SendButton = styled.button<{ $active: boolean }>`
    margin: 8px;
    padding: 8px;
    border-radius: 50%;
    border: none;
    background-color: ${({ $active }) => ($active ? "#2563eb" : "#6b7280")};
    color: white;
    cursor: ${({ $active }) => ($active ? "pointer" : "not-allowed")};
    transition: all 0.2s ease;
    transform: ${({ $active }) => ($active ? "scale(1)" : "scale(0.9)")};
    opacity: ${({ $active }) => ($active ? 1 : 0.6)};
    &:hover {
        background-color: ${({ $active }) => ($active ? "#1d4ed8" : "#6b7280")};
        transform: ${({ $active }) => ($active ? "scale(1.05)" : "scale(0.9)")};
    }
`;

export const HintText = styled.p<{ $isInputCentered: boolean }>`
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
    margin: 8px 0 0 0;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 1 : 0.7)};
    transition: opacity 0.3s ease;
`;
