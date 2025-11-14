import {
    FileSearchOutlined,
    FormOutlined,
    PictureOutlined,
} from "@ant-design/icons";

export const sidebarUnitItems = [
    {
        key: "sub1",
        label: "Chat",
        icon: <FormOutlined />,
        children: [
            {
                key: "1",
                label: "chat mới",
                path: "/chat/new",
            },
            {
                key: "2",
                label: "Phân tích file",
                path: "/chat/file-to-text",
            },
        ],
    },
    {
        key: "sub2",
        icon: <FileSearchOutlined />,
        label: "Tạo / Xử lý hình ảnh",
        children: [
            {
                key: "3",
                label: "Tạo ảnh",
                path: "/chat/create-image",
            },
            {
                key: "4",
                label: "Xử lý ảnh",
                children: [
                    {
                        key: "5",
                        label: "Xử lý ảnh",
                        path: "/chat/handle-image",
                    },
                    {
                        key: "6",
                        label: "Làm nét ảnh",
                        path: "/chat/increase-image-resolution",
                    },
                    {
                        key: "7",
                        label: "Tách nền ảnh",
                        path: "/chat/background-separation",
                    },
                    {
                        key: "8",
                        label: "Nén ảnh",
                        path: "/chat/image-compression",
                    },
                ],
            },
        ],
    },
    {
        key: "sub3",
        icon: <PictureOutlined />,
        label: "Tạo trò chơi",
        path: "/chat/create-game",
    },
    {
        key: "sub4",
        icon: <PictureOutlined />,
        label: "Thư viện",
        path: "/chat/library",
    },
];
