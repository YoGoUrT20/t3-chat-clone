export const CATEGORY_QUESTIONS = {
  Create: [
    'Invent a new holiday and describe how it is celebrated',
    'Design a futuristic city and its main features',
    'Describe a world where gravity works in reverse',
    'List 5 unusual ways to use a paperclip',
  ],
  Explore: [
    'Top 10 tallest mountains in the world',
    'Most popular foods in Japan',
    'Famous inventors and their inventions',
    'How do submarines work?',
  ],
  Code: [
    'Write a function to check for palindromes in JavaScript',
    'Difference between let, const, and var in JavaScript',
    'Explain the concept of closures in JavaScript',
    'How to optimize a React app for performance',
  ],
  Learn: [
    'Basics of blockchain technology',
    'What is quantum entanglement?',
    'How do vaccines work?',
    'History of the internet',
  ],
};

export const defaultQuestions = [
  'What is the tallest building in the world?',
  'How do airplanes fly?',
  'What causes rainbows?',
  'Who invented the telephone?',
];

export const MESSAGE_PLACEHOLDERS = [
  'What is the meaning of life?',
  'Can you explain quantum computing?',
  'Who was Albert Einstein?',
  'What would happen if everyone jumped at once?',
  'Is your red the same as my red?',
  'How much does a shadow weigh?',
  'What if the Earth stopped spinning?',
  'Why do we dream?',
  'What is the speed of dark?',
  'How old can you get?',
  'What is the resolution of the eye?',
  'What if you fell into a black hole?',
  'Why do we have two nostrils?',
  'What is the most dangerous place on Earth?',
  'How much does the internet weigh?',
  'What is nothing?',
  'What if the sun disappeared?',
  'Why do we feel deja vu?',
  'What is the largest number?',
  'How do you know you exist?'
];

export const capabilityColors = {
  vision: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  internet: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  thinking: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  reasoning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  imagegen: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

export const familyIcons = {
  gemini: '/gemini.svg',
  chatgpt: '/chatgpt.svg',
  claude: '/claude.svg',
  llama: '/llama.svg',
  deepseek: '/deepseek.svg',
  grok: '/grok.svg',
  qwen: '/qwen.svg',
};

export const colorThemes = [
  {
    name: 'Classic',
    user: { bg: '#4D1F39', text: '#F4E9EE' },
    assistant: { bg: '#201B25', text: '#BFB3CB' },
    themeType: 'dark',
  },
  {
    name: 'Ocean',
    user: { bg: '#1E3A5C', text: '#E0F7FA' },
    assistant: { bg: '#1565C0', text: '#E3F2FD' },
    themeType: 'light',
  },
  {
    name: 'Forest',
    user: { bg: '#2E7D32', text: '#E8F5E9' },
    assistant: { bg: '#388E3C', text: '#C8E6C9' },
    themeType: 'light',
  },
  {
    name: 'Sunset',
    user: { bg: '#FF7043', text: '#FFF3E0' },
    assistant: { bg: '#FFA726', text: '#FFF8E1' },
    themeType: 'light',
  },
  {
    name: 'Grape',
    user: { bg: '#6A1B9A', text: '#F3E5F5' },
    assistant: { bg: '#8E24AA', text: '#E1BEE7' },
    themeType: 'dark',
  },
  {
    name: 'Glass',
    user: { bg: 'rgba(255,255,255,0.13)', text: '#3bb0ff' },
    assistant: { bg: 'rgba(255,255,255,0.19)', text: '#a259ff' },
    themeType: 'dark',
  },
  {
    name: 'Transparent',
    user: { bg: 'transparent', text: '#23232a' },
    assistant: { bg: 'transparent', text: '#23232a' },
    themeType: 'dark',
  },
];

export const backgroundOptions = [
  { name: 'Default', value: 'default', themeType: 'dark' },
  { name: 'Glowing Blue', value: 'glow-blue', style: { background: 'radial-gradient(circle at 60% 40%, #3bb0ff 0%, #a259ff 100%)', boxShadow: '0 0 80px 10px #3bb0ff88' }, themeType: 'light' },
  { name: 'Glowing Pink', value: 'glow-pink', style: { background: 'radial-gradient(circle at 40% 60%, #ff70a6 0%, #ff9770 100%)', boxShadow: '0 0 80px 10px #ff70a688' }, themeType: 'light' },
  { name: 'Glow Under Messages', value: 'glow-under', style: { background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' }, themeType: 'light' },
  { name: 'Model Glow', value: 'model-glow', style: { background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' }, themeType: 'light' },
  { name: 'Model: Gemini', value: 'model-gemini', style: { background: 'radial-gradient(circle at 60% 40%, #9168C0 0%, #1BA1E3 100%)' }, themeType: 'light' },
];

export const glowOptions = [
  { name: 'Blue-Purple', value: 'glow-blue-purple', gradient: 'radial-gradient(circle at 80% 50%, #3bb0ff 0%, #a259ff 100%)' },
  { name: 'Pink-Orange', value: 'glow-pink-orange', gradient: 'radial-gradient(circle at 20% 50%, #ff70a6 0%, #ff9770 100%)' },
  { name: 'Green-Teal', value: 'glow-green-teal', gradient: 'radial-gradient(circle at 80% 50%, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Red-Yellow', value: 'glow-red-yellow', gradient: 'radial-gradient(circle at 20% 50%, #ff5858 0%, #f09819 100%)' },
]

export const modelFamilyGlowGradients = {
  gemini: 'radial-gradient(circle at 80% 50%, #1BA1E3 0%, #9168C0 100%)',
  deepseek: 'radial-gradient(circle at 80% 50%, #43e97b 0%, #38f9d7 100%)',
  chatgpt: 'radial-gradient(circle at 80% 50%, #43e97b 0%, #00c96b 100%)',
  claude: 'radial-gradient(circle at 80% 50%, #ffe066 0%, #ffb300 100%)',
  llama: 'radial-gradient(circle at 80% 50%, #a259ff 0%, #3bb0ff 100%)',
  grok: 'radial-gradient(circle at 80% 50%, #ff9770 0%, #ff5858 100%)',
  qwen: 'radial-gradient(circle at 80% 50%, #ff70a6 0%, #ff9770 100%)',
}

export const familyBgColors = {
  gemini: 'bg-gradient-to-r from-blue-400/30 to-blue-700/40 text-blue-100',
  chatgpt: 'bg-gradient-to-r from-green-400/30 to-green-700/40 text-green-100',
  claude: 'bg-gradient-to-r from-yellow-300/30 to-yellow-600/40 text-yellow-900',
  llama: 'bg-gradient-to-r from-purple-300/30 to-purple-700/40 text-purple-100',
  deepseek: 'bg-gradient-to-r from-pink-300/30 to-pink-700/40 text-pink-100',
  grok: 'bg-gradient-to-r from-orange-300/30 to-orange-700/40 text-orange-100',
  qwen: 'bg-gradient-to-r from-red-300/30 to-red-700/40 text-red-100',
};

export const syntaxThemes = [
  { name: 'GitHub Dark', value: 'github-dark' },
  { name: 'Atom One Dark', value: 'atom-one-dark' },
  { name: 'Atom One Light', value: 'atom-one-light' },
  { name: 'Monokai', value: 'monokai' },
  { name: 'Night Owl', value: 'night-owl' },
  { name: 'VS2015', value: 'vs2015' },
];

export const fontOptions = [
  { name: 'Inter', style: { fontFamily: 'Inter, sans-serif' } },
  { name: 'Roboto', style: { fontFamily: 'Roboto, sans-serif' } },
  { name: 'Georgia', style: { fontFamily: 'Georgia, serif' } },
  { name: 'Fira Mono', style: { fontFamily: 'Fira Mono, monospace' } },
  { name: 'Comic Sans MS', style: { fontFamily: 'Comic Sans MS, cursive, sans-serif' } },
];

export const previewMessages = [
  { role: 'user', text: 'This is a user message preview.' },
  { role: 'assistant', text: 'This is an assistant message preview.' },
  { role: 'user', text: 'Another user message, a bit longer to test wrapping and style.' },
  { role: 'assistant', text: 'Another assistant message, with more content to see how it looks.' },
];

export const presets = [
  {
    name: 'Classic Light',
    font: 'Inter',
    theme: 'Classic',
    background: 'default',
    syntaxTheme: 'github-dark',
    glow: { type: 'glow-blue-purple', intensity: 0.7 },
  },
  {
    name: 'Night Glow',
    font: 'Fira Mono',
    theme: 'Midnight',
    background: 'glow-under',
    syntaxTheme: 'night-owl',
    glow: { type: 'glow-pink-orange', intensity: 1 },
  },
  {
    name: 'Soft Pastel',
    font: 'Georgia',
    theme: 'Pastel',
    background: 'glow-under',
    syntaxTheme: 'atom-one-light',
    glow: { type: 'glow-green-teal', intensity: 0.5 },
  },
]; 