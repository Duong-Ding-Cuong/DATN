import React from "react";
import styled from "styled-components";

type Props = {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    onReset: () => void;
};

export const GamePreview: React.FC<Props> = ({ iframeRef, onReset }) => {
    return (
        <GameContainer>
            <GameHeader>
                <GameTitle>🎮 Game Preview</GameTitle>
                <ResetButton onClick={onReset}>🔄 Reset</ResetButton>
            </GameHeader>

            <GameFrame
                ref={iframeRef}
                title="Game Preview"
                sandbox="allow-scripts allow-same-origin"
            />

            <GameInstructions>
                ℹ️ Sử dụng chuột và bàn phím để điều khiển game
            </GameInstructions>
        </GameContainer>
    );
};

const GameContainer = styled.div`
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    background: #212121;
    border-left: 1px solid #404040;
    display: flex;
    flex-direction: column;
    z-index: 11;
`;

const GameHeader = styled.div`
    padding: 16px 24px;
    background: #303030;
    border-bottom: 1px solid #404040;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const GameTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
`;

const ResetButton = styled.button`
    background: rgba(220, 38, 38, 0.1);
    color: #ef4444;
    border: 1px solid #ef4444;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #ef4444;
        color: white;
    }
`;

const GameFrame = styled.iframe`
    flex: 1;
    width: 100%;
    border: none;
    background: white;
`;

const GameInstructions = styled.div`
    padding: 12px 24px;
    background: #303030;
    border-top: 1px solid #404040;
    font-size: 13px;
    color: #888888;
    text-align: center;
`;
