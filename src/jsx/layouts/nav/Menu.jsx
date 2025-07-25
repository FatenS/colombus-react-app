const stripByRole = (items, isAdmin) => {
  return items
  .filter((it) => {
    // Only log undefined adminOnly properties in development
    if (process.env.NODE_ENV === 'development' && it.adminOnly === undefined) {
      console.log(`Warning: ${it.title} has undefined adminOnly property`);
    }
    // If clientOnly is true, only show if NOT admin
    if (it.clientOnly) return !isAdmin;
    return !it.adminOnly || isAdmin;
  })
  .map((it) =>
    it.content ? { ...it, content: stripByRole(it.content, isAdmin) } : it
  )
  .filter((it) => it.to || (it.content && it.content.length));
};

export const MenuList = [
  //Dashboard
  {
    title: "Dashboard",
    classsChange: "mm-collapse",
    iconStyle: <i className="material-symbols-outlined">dashboard</i>,
    content: [
      {
        title: "Dashboard",
        to: "dashboard",
        adminOnly: false, // visible to non-admins (clients)
        clientOnly: true  // <-- add this property to clarify
      },
      // {
      //   title: "Dashboard Dark",
      //   to: "index-2",
      // },
      // {
      //   title: "Market",
      //   to: "market",
      // },
      // {
      //   title: "Coin Details",
      //   to: "coin-details",
      // },
      {
        title: "TCA",
        to: "tca",
        adminOnly: true 
      },
    ],
  },

  {
    title: "Orders",
    classsChange: "mm-collapse",
    iconStyle: <i className="material-symbols-outlined">monitoring</i>,
    content: [
      // {
      //   title: "Market",
      //   to: "trading-market",
      // },
      // {
      //   title: "Ico Listing",
      //   to: "ico-listing",
      // },
      {
        title: "Simulation",
        to: "simulation",
        adminOnly: false
      },
      {
        title: "Order",
        to: "order",
        adminOnly: false
      },
    ],
  },
  // {
  //   title: "Banking",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">monetization_on</i>,
  //   content: [
  // {
  //   title: "Market Watch",
  //   to: "market-watch",
  // },
  // {
  //   title: "Exchange",
  //   to: "exchange",
  // },
  // {
  //   title: "Banking",
  //   to: "banking",
  // },
  //   ],
  // },
  // {
  //   title: "Reports",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">lab_profile</i>,
  //   content: [
  //     {
  //       title: "History",
  //       to: "history",
  //     },
  //     {
  //       title: "Orders",
  //       to: "orders",
  //     },
  //     {
  //       title: "Report",
  //       to: "reports",
  //     },
  //     {
  //       title: "User",
  //       to: "user",
  //     },
  //   ],
  // },

  // Apps
  // {
  //     title:"Apps",
  //     classsChange: "menu-title"
  // },
  {
    title: "Profile",
    classsChange: "mm-collapse",
    iconStyle: <i className="material-symbols-outlined">apps_outage</i>,
    content: [
      // {
      //   title: "Profile",
      //   to: "app-profile",
      // },
      {
        title: "Edit Profile",
        to: "edit-profile",
        adminOnly: false
      },
      // {
      //   title: "Post Details",
      //   to: "post-details",
      // },
      {
        title: "Email",
        adminOnly: true,
        hasMenu: true,
        content: [
          // {
          //   title: "Compose",
          //   to: "email-compose",
          // },
          {
            title: "Inbox",
            to: "email-inbox",
            adminOnly: true
          },
          // {
          //   title: "Read",
          //   to: "email-read",
          // },
        ],
      },
      // {
      //   title: "Calendar",
      //   to: "app-calender",
      // },
      // {
      //   title: "Invoice",
      //   //to: './',
      //   hasMenu: true,
      //   content: [
          // {
          //   title: "Product Grid",
          //   to: "ecom-product-grid",
          // },
          // {
          //   title: "Product List",
          //   to: "ecom-product-list",
          // },
          // {
          //   title: "Product Details",
          //   to: "ecom-product-detail",
          // },
          // {
          //   title: "Order",
          //   to: "ecom-product-order",
          // },
          {
            title: "Invoices",
            to: "checkout",
            adminOnly: false
          },
          // {
          //   title: "Invoice",
          //   to: "/invoice/:invoiceId",
          // },
          // {
          //   title: "Customers",
          //   to: "ecom-customers",
      //     // },
      //   ],
      // },
    ],
  },

  // //CMS
  // {
  //   title: "CMS",
  //   classsChange: "mm-collapse",
  //   // update:"New",
  //   iconStyle: <i className="flaticon-menu-1" />,
  //   content: [
  //     {
  //       title: "Content",
  //       to: "/content",
  //     },
  //     {
  //       title: "Menu",
  //       to: "/menu",
  //     },
  //     {
  //       title: "Email Template",
  //       to: "/email-template",
  //     },
  //     {
  //       title: "Blog",
  //       to: "/blog",
  //     },
  //     {
  //       title: "Add Content",
  //       to: "/content-add",
  //     },
  //     {
  //       title: "Add Email",
  //       to: "/add-email",
  //     },
  //     {
  //       title: "Add Blog",
  //       to: "/add-blog",
  //     },
  //     {
  //       title: "Blog Category",
  //       to: "/blog-category",
  //     },
  //   ],
  // },
  // //Charts
  // {
  //   title: "Charts",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">donut_large</i>,
  //   content: [
  //     {
  //       title: "RechartJs",
  //       to: "chart-rechart",
  //     },
  //     {
  //       title: "Chartjs",
  //       to: "chart-chartjs",
  //     },
  //     {
  //       title: "Sparkline",
  //       to: "chart-sparkline",
  //     },
  //     {
  //       title: "Apexchart",
  //       to: "chart-apexchart",
  //     },
  //   ],
  // },

  // //Boosttrap
  // {
  //   title: "Bootstrap",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">favorite</i>,
  //   content: [
  //     {
  //       title: "Accordion",
  //       to: "ui-accordion",
  //     },
  //     {
  //       title: "Alert",
  //       to: "ui-alert",
  //     },
  //     {
  //       title: "Badge",
  //       to: "ui-badge",
  //     },
  //     {
  //       title: "Button",
  //       to: "ui-button",
  //     },
  //     {
  //       title: "Modal",
  //       to: "ui-modal",
  //     },
  //     {
  //       title: "Button Group",
  //       to: "ui-button-group",
  //     },
  //     {
  //       title: "List Group",
  //       to: "ui-list-group",
  //     },
  //     {
  //       title: "Cards",
  //       to: "ui-card",
  //     },
  //     {
  //       title: "Carousel",
  //       to: "ui-carousel",
  //     },
  //     {
  //       title: "Dropdown",
  //       to: "ui-dropdown",
  //     },
  //     {
  //       title: "Popover",
  //       to: "ui-popover",
  //     },
  //     {
  //       title: "Progressbar",
  //       to: "ui-progressbar",
  //     },
  //     {
  //       title: "Tab",
  //       to: "ui-tab",
  //     },
  //     {
  //       title: "Typography",
  //       to: "ui-typography",
  //     },
  //     {
  //       title: "Pagination",
  //       to: "ui-pagination",
  //     },
  //     {
  //       title: "Grid",
  //       to: "ui-grid",
  //     },
  //   ],
  // },
  // //plugins
  // {
  //   title: "Plugins",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">scatter_plot</i>,
  //   content: [
  //     {
  //       title: "Select 2",
  //       to: "uc-select2",
  //     },

  //     {
  //       title: "Sweet Alert",
  //       to: "uc-sweetalert",
  //     },
  //     {
  //       title: "Toastr",
  //       to: "uc-toastr",
  //     },
  //     {
  //       title: "Light Gallery",
  //       to: "uc-lightgallery",
  //     },
  //   ],
  // },
  // //Widget
  // {
  //   title: "Widget",
  //   iconStyle: <i className="material-symbols-outlined">widgets</i>,
  //   classsChange: "mm-collapse",
  //   content: [
  //     {
  //       title: "Widget Card",
  //       to: "widget-card",
  //     },
  //     {
  //       title: "Widget Chart",
  //       to: "widget-chart",
  //     },
  //     {
  //       title: "Widget List",
  //       to: "widget-list",
  //     },
  //   ],
  // },

  // //Forms
  // {
  //   title: "Forms",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">request_quote</i>,
  //   content: [
  //     {
  //       title: "Form Elements",
  //       to: "form-element",
  //     },
  //     {
  //       title: "Wizard",
  //       to: "form-wizard",
  //     },
  //     {
  //       title: "CkEditor",
  //       to: "form-ckeditor",
  //     },
  //     {
  //       title: "Pickers",
  //       to: "form-pickers",
  //     },
  //     {
  //       title: "Form Validate",
  //       to: "form-validation",
  //     },
  //   ],
  // },

  // {
  //   title: "Table",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">table_chart</i>,
  //   content: [
  //     {
  //       title: "Table Filtering",
  //       to: "table-filtering",
  //     },
  //     {
  //       title: "Table Sorting",
  //       to: "table-sorting",
  //     },
  //     {
  //       title: "Bootstrap",
  //       to: "table-bootstrap-basic",
  //     },
  //   ],
  // },
  // //Pages
  // //Table
  // // {
  // //     title:"Extra",
  // //     classsChange:"menu-title"
  // // },
  // {
  //   title: "Pages",
  //   classsChange: "mm-collapse",
  //   iconStyle: <i className="material-symbols-outlined">lab_profile</i>,
  //   content: [
  //     {
  //       title: "Error",
  //       hasMenu: true,
  //       content: [
  //         {
  //           title: "Error 400",
  //           to: "page-error-400",
  //         },
  //         {
  //           title: "Error 403",
  //           to: "page-error-403",
  //         },
  //         {
  //           title: "Error 404",
  //           to: "page-error-404",
  //         },
  //         {
  //           title: "Error 500",
  //           to: "page-error-500",
  //         },
  //         {
  //           title: "Error 503",
  //           to: "page-error-503",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Lock Screen",
  //       to: "page-lock-screen",
  //     },
  //     {
  //       title: "Empty Page",
  //       to: "empty-page",
  //     },
  //   ],
  // },
];
export const buildMenu = (isAdmin) => stripByRole(MenuList, isAdmin);