import {
    FileSearchOutlined,
    FormOutlined,
    PictureOutlined,
} from "@ant-design/icons";

export const sidebarUnitItems = [
    {
        key: "sub1",
        label: " Đoạn chat mới ",
        icon: <FormOutlined />,
        children: [
            {
                key: "1",
                label: "Hoi dap voi AI",
                path: "/chat/new",
            },
            {
                key: "2",
                label: "Phan tich file",
                path: "/chat/analyze",
            },
        ],
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

// {
//     key: "1",
//     icon: <FormOutlined />,
//     label: "Đoạn chat mới",
//     path: "/chat/new",
// },
