import { useEffect, useRef } from "react";

import {
    RootContainer,
    MessagesContainer,
    MessagesInner,
    InputContainer,
    InputWrapper,
    StyledTextarea,
    SendButton,
    WelcomeContainer,
    WelcomeTitle,
} from "../../../components/new-chat.styled";
import { MyLayout } from "../../layout/layout";
import { useCreateGame } from "../hooks/use-create-game";
import { GameMessageList } from "./iframe-game";
import { GamePreview } from "../components/game-preview";

export const CreateGameComponent = () => {
    const {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        currentGame,
        iframeRef,
        handleSubmit,
        replayGame,
        resetGame,
    } = useCreateGame();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const onSubmit = async () => {
        if (!inputValue.trim() || isLoading) return;
        await handleSubmit();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <MyLayout>
            <RootContainer>
                {/* Left: Chat Messages */}
                {!isInputCentered && (
                    <MessagesContainer $isInputCentered={false}>
                        <MessagesInner>
                            <GameMessageList
                                messages={messages}
                                isLoading={isLoading}
                                onReplayGame={replayGame}
                            />
                            <div ref={messagesEndRef} />
                        </MessagesInner>
                    </MessagesContainer>
                )}

                {/* Right: Game Preview */}
                {currentGame && (
                    <GamePreview iframeRef={iframeRef} onReset={resetGame} />
                )}

                {/* Input */}
                <InputContainer $isInputCentered={isInputCentered}>
                    {isInputCentered && (
                        <WelcomeContainer>
                            <WelcomeTitle>
                                🎮 Mô tả game bạn muốn tạo
                            </WelcomeTitle>
                            <p
                                style={{
                                    color: "#666",
                                    fontSize: "14px",
                                    marginTop: "8px",
                                    textAlign: "center",
                                }}
                            >
                                Ví dụ: "Tạo game Flappy Bird", "Tạo game rắn săn
                                mồi", "Tạo game đập chuột"...
                            </p>
                        </WelcomeContainer>
                    )}

                    <InputWrapper>
                        <StyledTextarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Mô tả game bạn muốn tạo..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <SendButton
                            onClick={onSubmit}
                            disabled={!inputValue.trim() || isLoading}
                        >
                            {isLoading ? "⏳" : "➤"}
                        </SendButton>
                    </InputWrapper>
                </InputContainer>
            </RootContainer>
        </MyLayout>
    );
};
