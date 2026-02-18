export interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

export interface GuideSection {
    title: string;
    content: string[];
    subsections?: { title: string; content: string[] }[];
}

export const FAQ_DATA: FAQItem[] = [
    {
        category: "Privacy & Data",
        question: "Where is my data stored?",
        answer: "Your data never leaves your computer. ChartLabs uses the File System Access API to read and write directly to a local folder of your choice. No chart data is ever uploaded to our servers."
    },
    {
        category: "Privacy & Data",
        question: "Do I need an account?",
        answer: "An account is optional. It is used only to sync your configuration (symbols, timeframes, filename templates) and high-level analytics across devices. Your actual chart images and detailed trade logs remain strictly local."
    },
    {
        category: "Storage & Folders",
        question: "How do I add a new project?",
        answer: "Go to the Settings page and look for the Projects section. You can create a new project and then add 'Themes' within it to further categorize your trades."
    },
    {
        category: "Storage & Folders",
        question: "Can I use multiple storage folders?",
        answer: "Yes! You can link multiple local folders in the Settings > Storage section. Each folder acts as a separate database. You can quickly switch between them using the folder selector."
    },
    {
        category: "Storage & Folders",
        question: "Why does ChartLabs ask for permission to access my folder?",
        answer: "For security, browsers require you to re-grant permission each time you refresh the page or restart your browser. This ensures that the application only accesses the folders you've explicitly allowed."
    },
    {
        category: "Workflow & Features",
        question: "How do I record a trade with multiple entries/screenshots?",
        answer: "In the Workspace, after adding your first chart, you can use the 'Add Secondary Image' button (found in the chart list or detail view) to attach additional screenshots to the same trade record."
    },
    {
        category: "Workflow & Features",
        question: "Can I customize how my chart files are named?",
        answer: "Absolutely. In Settings > Template, you can define a FileName Template using tokens like {symbol}, {timeframe}, {outcome}, and {theme}. ChartLabs will automatically name your files based on this template when you save a chart."
    },
    {
        category: "Workflow & Features",
        question: "How is the 'Profit Factor' calculated?",
        answer: "The Profit Factor is the ratio of Gross Profit (total of all winning trades) to Gross Loss (total of all losing trades). A value above 1.0 indicates a profitable strategy."
    },
    {
        category: "Timer & Discipline",
        question: "Why should I use the Timer?",
        answer: "Backtesting requires discipline. The Timer helps you track exactly how much time you spend focused on a project, allowing you to measure your 'Time Invested' against your performance results."
    },
    {
        category: "Timer & Discipline",
        question: "Can I link a Timer session to a specific trade?",
        answer: "Timer sessions are linked to Projects and Themes. While they don't link to individual charts, they provide the context for entire backtesting sessions, which you can then analyze in the Dashboard."
    },
    {
        category: "Timer & Discipline",
        question: "What happens if I forget to stop the timer?",
        answer: "You can edit or delete your timer sessions in the History section of the Timer page if you need to correct any mistakes."
    },
    {
        category: "Technical",
        question: "Does ChartLabs work offline?",
        answer: "Yes. Since ChartLabs runs in your browser and interacts with your local file system, most core features (Backtesting, Timer, Analytics) will work perfectly without an internet connection once the app is loaded."
    },
    {
        category: "Technical",
        question: "Which browsers are supported?",
        answer: "ChartLabs requires the File System Access API, which is currently supported in modern versions of Chrome, Edge, and Opera."
    }
];

export const USER_GUIDE_DATA: GuideSection[] = [
    {
        title: "1. 🚀 Getting Started",
        content: [
            "ChartLabs is a privacy-first application. All your sensitive trading data and chart images are stored locally on your machine."
        ],
        subsections: [
            {
                title: "📁 Set Up Your Storage",
                content: [
                    "1. Navigate to the Settings page.",
                    "2. Click 'Add Folder'.",
                    "3. Choose a local directory where ChartLabs should save its data.",
                    "4. Note: You can add multiple folders to act as separate databases (e.g., 'Personal Strategy', 'Prop Firm Challenge')."
                ]
            },
            {
                title: "🏗️ Create Your Hierarchy",
                content: [
                    "Before logging trades, define your organization:",
                    "- Projects: The highest level of organization (e.g., 'Classic SMC', 'Trend Following').",
                    "- Themes: Specific variants or focal points within a project (e.g., 'London Killzone', 'Higher Timeframe Alignment')."
                ]
            }
        ]
    },
    {
        title: "2. 🎨 The Workspace",
        content: [
            "The Workspace is where you analyze and record your backtesting data."
        ],
        subsections: [
            {
                title: "🖼️ Importing Charts",
                content: [
                    "Click 'Add Chart' to upload a screenshot or paste an image. ChartLabs will automatically process it and prepare it for your notes."
                ]
            },
            {
                title: "📝 Notes & Observations",
                content: [
                    "Instead of drawing on the chart, ChartLabs provides a dedicated Notes section for each trade. Use this to:",
                    "- Document your entry criteria.",
                    "- Describe the emotional state or context of the trade.",
                    "- Record any specific observations about the price action."
                ]
            },
            {
                title: "📝 Trade Records",
                content: [
                    "Fill in the trade details on the right panel:",
                    "- Symbol & Timeframe: Automatically suggested based on your configuration.",
                    "- Outcome (Optional): Mark as Win, Loss, or Break Even.",
                    "- P&L & RR (Optional): Record the financial impact and risk reward of the trade.",
                    "- Trading Day: Capture the specific day of the week to analyze periodicity."
                ]
            }
        ]
    },
    {
        title: "3. ⌛ The Timer: Discipline Tracking",
        content: [
            "The Timer is more than just a stopwatch; it's a tool for measuring your backtesting efficiency."
        ],
        subsections: [
            {
                title: "🏁 Starting a Session",
                content: [
                    "1. Context First: Select the Project, Theme, and Symbol you are focusing on. This ensures your time data is properly categorized.",
                    "2. Focus: Click 'Start Timer'. The app will track your active time.",
                    "3. Log & Review: When done, click 'Log Session'. You can view your history to see patterns in your backtesting habits and correct any sessions if needed."
                ]
            }
        ]
    },
    {
        title: "4. 📊 Analytics Dashboard: Performance & Time",
        content: [
            "ChartLabs combines your trade data with your time data to give you a 360-degree view of your performance."
        ],
        subsections: [
            {
                title: "📈 Core Trading Metrics",
                content: [
                    "- Equity Curve: Your cumulative P&L growth over time.",
                    "- Win Rate & Profit Factor: Standard industry metrics to validate your edge.",
                    "- Avg RR: The average reward achieved relative to your risk."
                ]
            },
            {
                title: "⌛ Time Analytics (Discipline Metrics)",
                content: [
                    "- Total Time Invested: The aggregate of all your logged timer sessions.",
                    "- Time Distribution: A breakdown of how much effort is going into each Project or Theme.",
                    "- Correlation: Analyze if more time spent backtesting correlates with higher Win Rates or profitability in the segmented charts."
                ]
            },
            {
                title: "🔍 Segmented Breakdowns",
                content: [
                    "- Daily Performance: Analyze profitability by the day of the week.",
                    "- Symbol & Timeframe Stats: Identify your 'Sweet Spot' pairs and timeframes.",
                    "- R:R Distribution: A visual representation of your trade outcome frequency."
                ]
            }
        ]
    },
    {
        title: "5. ⚙️ Advanced Settings",
        content: [],
        subsections: [
            {
                title: "🏷️ Configuration",
                content: [
                    "Edit the default lists for Symbols, Timeframes, Sessions, and Common Tags in the Settings page to match your specific strategy requirements."
                ]
            },
            {
                title: "📂 File Naming Templates",
                content: [
                    "Customize how ChartLabs names your chart files for easier manual browsing:",
                    "- Use tokens like {symbol}, {timeframe}, {outcome}, and {theme}.",
                    "  Example: {symbol}_{timeframe}_{outcome} saves files as EURUSD_H1_win.png."
                ]
            }
        ]
    }
];
