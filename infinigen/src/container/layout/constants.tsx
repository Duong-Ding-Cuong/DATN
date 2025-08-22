export const sitebarItems = [
  {
    label: "Thông tin chung",
    key: "general-info",
    path: "/web/operation/operating-info-common",
  },
  {
    label: "Báo cáo",
    key: "reports",
    children: [
      {
        label: "Nhật ký kiểm tra định kỳ",
        key: "report-log",
        path: "/web/operation/periodic-inspection-report",
      },
      {
        label: "Hoạt động có kế hoạch",
        key: "planned-activity",
        path: "/web/operation/report-plan",
      },
    ],
  },
];