import styled from "styled-components";

export const RootContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #212121;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export const MessagesContainer = styled.div<{ $isInputCentered: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 140px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 0 : 1)};
    transition: opacity 0.3s ease-in-out;

    scrollbar-width: none;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
            background-color: rgba(255, 255, 255, 0.3);
        }
    }

    scroll-behavior: smooth;
`;

export const MessagesInner = styled.div`
    max-width: 768px;
    margin: 0 auto;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
`;

export const InputContainer = styled.div<{ $isInputCentered: boolean }>`
    position: absolute;
    left: 50%;
    ${({ $isInputCentered }) =>
        $isInputCentered
            ? `
        top: 50%;
        transform: translate(-50%, -50%);
    `
            : `
        bottom: 0;
        transform: translate(-50%, 0);
    `}
    width: 100%;
    padding: 20px;
    background: ${({ $isInputCentered }) =>
        $isInputCentered
            ? "transparent"
            : "linear-gradient(transparent, #212121 20%)"};
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
`;

export const WelcomeContainer = styled.div`
    text-align: center;
    margin-bottom: 30px;
    animation: fadeIn 0.6s ease-in;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

export const WelcomeTitle = styled.h1`
    color: #ffffff;
    font-size: 2.5rem;
    font-weight: 600;
    margin: 0 0 12px 0;
    background: #ffffff;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

export const WelcomeSubtitle = styled.p`
    color: #888;
    font-size: 1rem;
    margin: 0;
`;

export const InputWrapper = styled.div`
    width: 100%;
    max-width: 768px;
    display: flex;
    gap: 8px;
    align-items: flex-end;
    background-color: #303030;
    border: 1px solid #404040;
    border-radius: 12px;
    padding: 8px;
    transition: all 0.3s ease;

    &:focus-within {
        border-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
`;

export const StyledTextarea = styled.textarea`
    flex: 1;
    min-height: 48px;
    max-height: 200px;
    padding: 12px;
    background-color: transparent;
    color: #ffffff;
    border: none;
    font-size: 1rem;
    resize: none;
    outline: none;
    font-family: inherit;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &::placeholder {
        color: #666;
    }

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: #555;
        border-radius: 4px;
    }
`;

export const SendButton = styled.button`
    width: 40px;
    height: 40px;
    background-color: #ff6f5c;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
        background-color: #d5685b;
        transform: scale(1.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: none;
    }
`;
