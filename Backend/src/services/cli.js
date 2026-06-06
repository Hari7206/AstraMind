// import { createInterface } from "readline";
// import { askAI } from "./ai.service.js";

// const rl = createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// function ask(question) {
//   return new Promise((resolve) => {
//     rl.question(question, resolve);
//   });
// }

// console.log("🤖 Gemini CLI Started");
// console.log("Type 'exit' to quit.\n");

// async function main() {
//   while (true) {
//     const input = await ask("You: ");

//     if (!input || input.trim().toLowerCase() === "exit") {
//       break;
//     }

//     const response = await askAI(input);

//     console.log(`\n🤖 AI: ${response}\n`);
//   }

//   rl.close();
// }

// main();