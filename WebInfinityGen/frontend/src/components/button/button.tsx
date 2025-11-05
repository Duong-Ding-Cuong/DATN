import React, { useRef } from "react";
import styled from "styled-components";

type UploadButtonProps = {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
};

export const UploadButton = ({
    onFileSelect,
    disabled = false,
}: UploadButtonProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            // Reset để có thể chọn lại cùng file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <FileButton as="label">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={handleFileChange}
                disabled={disabled}
                style={{ display: "none" }}
            />
        </FileButton>
    );
};

const FileButton = styled.label`
    margin: 8px 0 8px 8px;
    padding: 8px;
    border-radius: 8px;
    border: none;
    background-color: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
    }

    &:has(input:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
