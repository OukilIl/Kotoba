# Kotoba - Japanese Learning Toolkit

Kotoba is a browser-based Japanese language learning application that provides powerful text analysis and vocabulary practice tools. It connects with JPDB for vocabulary integration and uses Google's Gemini AI models for advanced text breakdown.

## 🌟 Features

- **Detailed Text Breakdown** - Analyze Japanese sentences to understand grammar, vocabulary, and language nuances
- **Vocabulary Practice** - Practice creating sentences with words from your JPDB vocabulary decks 
- **JLPT Grammar Analysis** - Identify grammar patterns and get explanations with JLPT level indicators
- **Browser-Only** - Everything runs in your browser with no server-side processing, no login required
- **Visual Sentence Structure** - See the sentence structure broken down into components with color-coding
- **Part of Speech Filters** - Practice with specific types of words (verbs, nouns, adjectives, etc.)

## 🚀 Live Version

Try the live version at: [https://kotoba-app.xyz](https://kotoba-app.xyz)

## 🛠️ Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Configuration

To use all features, you'll need to configure:

1. **JPDB API Key** - For accessing your vocabulary decks
2. **Google API Key** - For the text breakdown and analysis features

These can be set up in the Settings page of the application.

## 📚 How It Works

- **Text Breakdown** - Paste any Japanese text to get a detailed analysis of grammar, vocabulary, and sentence structure
- **Deck Management** - Connect to your JPDB account to access your vocabulary decks
- **Practice** - Select vocabulary by part of speech and practice creating sentences
- **Feedback** - Get feedback on your sentences to improve your Japanese writing skills

## 💻 Technology

This project is built with:

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Google Gemini API](https://ai.google.dev/) - For text analysis
- [JPDB API](https://jpdb.io/api-docs) - For vocabulary management

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).