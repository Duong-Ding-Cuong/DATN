import {
    FileSearchOutlined,
    FormOutlined,
    PictureOutlined,
} from "@ant-design/icons";

export const sidebarUnitItems = [
    {
        key: "1",
        icon: <FormOutlined />,
        label: "Đoạn chat mới",
        path: "/chat/new",
    },
    {
        key: "2",
        icon: <FileSearchOutlined />,
        label: "Tìm kiếm đoạn chat",
        path: "/chat/search",
    },
    {
        key: "3",
        icon: <PictureOutlined />,
        label: "Thư viện",
        path: "/chat/library",
    },
];
