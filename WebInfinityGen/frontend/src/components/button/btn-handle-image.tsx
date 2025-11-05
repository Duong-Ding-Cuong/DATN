import React, { useRef } from "react";
import type { ChangeEvent } from "react";
import styled from "styled-components";
import { FileImageOutlined } from "@ant-design/icons";

type UploadImageButtonProps = {
    onImageSelect: (file: File, preview: string) => void;
    disabled?: boolean;
    accept?: string;
    maxSizeMB?: number;
    icon?: React.ReactNode;
    buttonText?: string;
    showFileName?: boolean;
};

export const UploadImageButton = ({
    onImageSelect,
    disabled = false,
    accept = "image/*",
    maxSizeMB = 10, //set giới hạn dung lượng ảnh 10MB
    icon,
    buttonText,
    showFileName = false,
}: UploadImageButtonProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = React.useState<string>("");

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Kiểm tra file type
        if (!file.type.startsWith("image/")) {
            alert("⚠️ Vui lòng chỉ chọn file ảnh!");
            return;
        }

        // Kiểm tra kích thước file
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            alert(`⚠️ File quá lớn! Vui lòng chọn ảnh nhỏ hơn ${maxSizeMB}MB`);
            return;
        }

        // Tạo preview URL
        const preview = URL.createObjectURL(file);

        // Set file name nếu cần hiển thị
        if (showFileName) {
            setSelectedFileName(file.name);
        }

        // Callback
        onImageSelect(file, preview);

        // Reset input để có thể chọn lại cùng file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <ButtonWrapper>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
                style={{ display: "none" }}
            />

            <StyledButton onClick={handleClick} disabled={disabled}>
                {icon ?? <FileImageOutlined />}
                {buttonText && <ButtonText>{buttonText}</ButtonText>}
            </StyledButton>

            {showFileName && selectedFileName && (
                <FileName>{selectedFileName}</FileName>
            )}
        </ButtonWrapper>
    );
};

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

const StyledButton = styled.button`
    min-width: 100px;
    height: 50px;
    padding: 0 12px;
    border-radius: 8px;
    border: none;
    background-color: #ff6f5c;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 2.1rem;

    &:hover:not(:disabled) {
        background-color: #d63925;
        color: white;
        transform: scale(1.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

const ButtonText = styled.span`
    font-size: 1.2rem;
    font-weight: 500;
`;

const FileName = styled.span`
    font-size: 0.85rem;
    color: #9ca3af;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;
