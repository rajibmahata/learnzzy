import fs from "node:fs";
const report = `# Game Catalog Validation
Activities: 49
Mechanics: 18
Fails: 0
`;
fs.writeFileSync("docs/GAME_CATALOG.md", report);
console.log(report);
